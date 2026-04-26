import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashKey(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "hvk_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ─── API Key Auth ────────────────────────────────────────────────────────────

async function resolveApiKey(
  supabase: ReturnType<typeof createClient>,
  req: Request
): Promise<{ valid: false } | { valid: true; keyId: string; orgName: string }> {
  const auth = req.headers.get("Authorization");
  const xkey = req.headers.get("X-API-Key");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : xkey;
  if (!raw) return { valid: false };

  const hash = await hashKey(raw);
  const { data, error } = await supabase
    .from("inbound_api_keys")
    .select("id, organization_name, is_active")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return { valid: false };

  await supabase
    .from("inbound_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { valid: true, keyId: data.id, orgName: data.organization_name };
}

// ─── JWT Auth (for key management) ──────────────────────────────────────────

function getUserIdFromJwt(req: Request): string | null {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// ─── Patient Resolution ───────────────────────────────────────────────────────

async function resolvePatientId(
  supabase: ReturnType<typeof createClient>,
  body: Record<string, unknown>
): Promise<string | null> {
  if (typeof body.patientId === "string" && body.patientId) {
    return body.patientId;
  }
  if (typeof body.patientEmail === "string" && body.patientEmail) {
    const { data } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("email", body.patientEmail)
      .maybeSingle();
    return data?.user_id ?? null;
  }
  return null;
}

// ─── FHIR Bundle Mapper ───────────────────────────────────────────────────────

interface NormalizedRecord {
  kind: string;
  title: string;
  providerName: string | null;
  serviceDate: string | null;
  fileType: string;
  base64: string | null;
  fileName: string | null;
  notes: string | null;
  fhirRef: Record<string, unknown> | null;
}

function mapFhirBundle(bundle: Record<string, unknown>): NormalizedRecord[] {
  const entries = (bundle.entry as Array<{ resource?: Record<string, unknown> }>) ?? [];
  const records: NormalizedRecord[] = [];

  for (const entry of entries) {
    const res = entry.resource;
    if (!res) continue;
    const resourceType = res.resourceType as string;

    if (resourceType === "DocumentReference") {
      const content = (res.content as Array<{ attachment?: Record<string, unknown> }>)?.[0];
      const attachment = content?.attachment ?? {};
      const category = (res.category as Array<{ coding?: Array<{ display?: string }> }>)?.[0]?.coding?.[0]?.display;
      records.push({
        kind: "other",
        title: (res.description as string) ?? category ?? "Clinical Document",
        providerName: null,
        serviceDate: (res.date as string)?.slice(0, 10) ?? null,
        fileType: (attachment.contentType as string)?.includes("pdf") ? "pdf" : "other",
        base64: (attachment.data as string) ?? null,
        fileName: (attachment.title as string) ?? null,
        notes: null,
        fhirRef: { resourceType, id: res.id },
      });
    } else if (resourceType === "DiagnosticReport") {
      const category = (res.category as Array<{ coding?: Array<{ code?: string }> }>)?.[0]?.coding?.[0]?.code ?? "";
      const kind = category.toLowerCase().includes("path") ? "pathology" : "lab";
      records.push({
        kind,
        title: (res.code as { text?: string })?.text ?? "Diagnostic Report",
        providerName: null,
        serviceDate: (res.effectiveDateTime as string)?.slice(0, 10) ?? null,
        fileType: "pdf",
        base64: null,
        fileName: null,
        notes: (res.conclusion as string) ?? null,
        fhirRef: { resourceType, id: res.id },
      });
    } else if (resourceType === "ImagingStudy") {
      records.push({
        kind: "imaging",
        title: (res.description as string) ?? "Imaging Study",
        providerName: null,
        serviceDate: (res.started as string)?.slice(0, 10) ?? null,
        fileType: "dicom",
        base64: null,
        fileName: null,
        notes: null,
        fhirRef: { resourceType, id: res.id },
      });
    }
  }

  return records;
}

function normalizeKind(kind: string | undefined): string {
  const map: Record<string, string> = {
    LAB: "lab",
    IMAGING: "imaging",
    PATHOLOGY: "pathology",
    SPECIALIST_REPORT: "specialist_report",
    OTHER: "other",
  };
  if (!kind) return "other";
  return map[kind.toUpperCase()] ?? kind.toLowerCase();
}

function kindTitle(kind: string): string {
  const map: Record<string, string> = {
    lab: "Lab Results",
    imaging: "Imaging & Scans",
    pathology: "Pathology Report",
    specialist_report: "Specialist Report",
    other: "Health Record",
  };
  return map[kind] ?? "Health Record";
}

// ─── Ingest Handler ──────────────────────────────────────────────────────────

async function handleIngest(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  orgName: string
) {
  const body = (await req.json()) as Record<string, unknown>;

  const patientId = await resolvePatientId(supabase, body);
  if (!patientId) {
    return jsonResponse(
      {
        error: "Patient not found. Provide patientId (user_id) or patientEmail.",
      },
      404
    );
  }

  // Keragon Path B: provider not connected — update connection status and acknowledge
  if (body.status === "pending_auth") {
    const ehrSource = body.ehr_source as string | undefined;

    if (ehrSource && patientId) {
      await supabase
        .from("provider_connections")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("user_id", patientId)
        .eq("ehr_source", ehrSource)
        .eq("connection_method", "keragon");
    }

    return jsonResponse({
      received: 0,
      status: "pending_auth",
      patientId,
      message: "Patient authorization pending. Status updated.",
    });
  }

  let normalized: NormalizedRecord[] = [];

  // FHIR Bundle path
  if (
    body.resourceType === "Bundle" ||
    (body.records === undefined && body.entry !== undefined)
  ) {
    normalized = mapFhirBundle(body as Record<string, unknown>);
  } else {
    const rawRecords = (body.records as Array<Record<string, unknown>>) ?? [];
    normalized = rawRecords.map((r) => ({
      kind: normalizeKind(r.kind as string),
      title: (r.title as string) ?? kindTitle(normalizeKind(r.kind as string)),
      providerName: (r.providerName as string) ?? (r.provider_name as string) ?? null,
      serviceDate: (r.serviceDate as string) ?? (r.service_date as string) ?? null,
      fileType: (r.fileType as string) ?? (r.file_type as string) ?? "pdf",
      base64: (r.base64 as string) ?? null,
      fileName: (r.fileName as string) ?? (r.file_name as string) ?? null,
      notes: (r.notes as string) ?? null,
      fhirRef: (r.fhirRef as Record<string, unknown>) ?? null,
    }));
  }

  if (normalized.length === 0) {
    return jsonResponse(
      { error: "No records provided. Include a 'records' array or a FHIR Bundle." },
      400
    );
  }

  const inserted: Array<{ id: string; title: string; kind: string }> = [];

  for (const rec of normalized) {
    let previewUrl: string | null = null;
    let storagePath: string | null = null;
    let fileSizeBytes: number | null = null;

    if (rec.base64) {
      try {
        const fileBytes = Uint8Array.from(atob(rec.base64), (c) =>
          c.charCodeAt(0)
        );
        fileSizeBytes = fileBytes.length;
        const fileName =
          rec.fileName ?? `${crypto.randomUUID()}.${rec.fileType ?? "bin"}`;
        storagePath = `${patientId}/${crypto.randomUUID()}-${fileName}`;

        const contentType =
          rec.fileType === "pdf"
            ? "application/pdf"
            : rec.fileType === "dicom"
            ? "application/dicom"
            : rec.fileType?.match(/^(jpg|jpeg)$/)
            ? "image/jpeg"
            : rec.fileType === "png"
            ? "image/png"
            : "application/octet-stream";

        const { error: uploadErr } = await supabase.storage
          .from("inbound-records")
          .upload(storagePath, fileBytes, { contentType, upsert: false });

        if (!uploadErr) {
          const { data: signed } = await supabase.storage
            .from("inbound-records")
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
          previewUrl = signed?.signedUrl ?? null;
        }
      } catch {
        // Non-fatal: record still inserted without file
      }
    }

    const { data: row, error: insertErr } = await supabase
      .from("health_records")
      .insert({
        user_id: patientId,
        kind: rec.kind,
        title: rec.title,
        provider_name: rec.providerName ?? orgName ?? null,
        service_date: rec.serviceDate ?? null,
        source: "connected",
        file_type: rec.fileType ?? null,
        file_size_bytes: fileSizeBytes,
        preview_url: previewUrl,
        tags: [],
        fhir_ref: rec.fhirRef ?? null,
      })
      .select("id, title, kind")
      .single();

    if (!insertErr && row) {
      inserted.push(row);
    }
  }

  return jsonResponse({
    received: inserted.length,
    patientId,
    records: inserted,
  });
}

// ─── Key Management Handlers ─────────────────────────────────────────────────

async function handleCreateKey(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const body = (await req.json()) as Record<string, unknown>;
  const name = (body.name as string) ?? "API Key";
  const organizationName = (body.organizationName as string) ?? "";

  const rawKey = generateApiKey();
  const keyHash = await hashKey(rawKey);

  const { data, error } = await supabase
    .from("inbound_api_keys")
    .insert({
      key_hash: keyHash,
      name,
      organization_name: organizationName,
      created_by: userId,
      is_active: true,
    })
    .select("id, name, organization_name, created_at")
    .single();

  if (error) {
    return jsonResponse({ error: "Failed to create API key." }, 500);
  }

  // Raw key is returned ONCE — it is never stored and cannot be recovered
  return jsonResponse({ ...data, key: rawKey }, 201);
}

async function handleListKeys(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from("inbound_api_keys")
    .select("id, name, organization_name, is_active, created_at, last_used_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) return jsonResponse({ error: "Failed to fetch keys." }, 500);
  return jsonResponse({ keys: data ?? [] });
}

async function handleRevokeKey(
  supabase: ReturnType<typeof createClient>,
  keyId: string,
  userId: string
) {
  const { error } = await supabase
    .from("inbound_api_keys")
    .update({ is_active: false })
    .eq("id", keyId)
    .eq("created_by", userId);

  if (error) return jsonResponse({ error: "Failed to revoke key." }, 500);
  return jsonResponse({ revoked: true });
}

// ─── Router ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(req.url);
  // Strip leading function name segment: /inbound-records/... → [...]
  const parts = url.pathname.split("/").filter(Boolean).slice(1);

  try {
    // Health check — no auth
    if (req.method === "GET" && parts[0] === "health") {
      return jsonResponse({ status: "ok" });
    }

    // POST / — ingest records via API key
    if (req.method === "POST" && parts.length === 0) {
      const auth = await resolveApiKey(supabase, req);
      if (!auth.valid) {
        return jsonResponse(
          { error: "Invalid or missing API key. Use Authorization: Bearer <key> or X-API-Key header." },
          401
        );
      }
      return await handleIngest(req, supabase, auth.orgName);
    }

    // Key management — requires JWT
    if (parts[0] === "keys") {
      const userId = getUserIdFromJwt(req);
      if (!userId) {
        return jsonResponse({ error: "Authentication required." }, 401);
      }

      if (req.method === "GET" && parts.length === 1) {
        return await handleListKeys(supabase, userId);
      }
      if (req.method === "POST" && parts.length === 1) {
        return await handleCreateKey(req, supabase, userId);
      }
      if (req.method === "DELETE" && parts.length === 2) {
        return await handleRevokeKey(supabase, parts[1], userId);
      }
    }

    return jsonResponse({ error: "Not found." }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
});
