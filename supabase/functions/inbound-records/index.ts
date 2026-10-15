import { validRetryKey, sha256, batchFingerprint } from "./receipt.ts";
import { readJsonObject, RequestBodyError, UPLOAD_BODY_LIMIT, CONTROL_BODY_LIMIT } from "./body.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";

import { ImportAccessError, requireActiveAccount, requireVerifiedUser, requireImportOwner } from "./access.ts";

import { persistImport, type SavedRecord } from "./persist.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key, X-Platform, Idempotency-Key",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "private, no-store" },
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
  supabase: SupabaseClient,
  req: Request
): Promise<{ valid: false } | { valid: true; keyId: string; orgName: string; ownerId: string }> {
  const auth = req.headers.get("Authorization");
  const xkey = req.headers.get("X-API-Key");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : xkey;
  if (!raw) return { valid: false };

  const hash = await hashKey(raw);
  const { data, error } = await supabase
    .from("inbound_api_keys")
    .select("id, organization_name, is_active, created_by")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new ImportAccessError(503, "Import authorization is unavailable.");
  if (!data) return { valid: false };
  await requireActiveAccount(supabase, data.created_by);

  await supabase
    .from("inbound_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { valid: true, keyId: data.id, orgName: data.organization_name, ownerId: data.created_by };
}

// ─── Patient Resolution ───────────────────────────────────────────────────────

async function resolvePatientId(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
  ownerId: string,
  personalUpload = false
): Promise<string | null> {
  if (typeof body.patientId === "string" && body.patientId) {
    return body.patientId;
  }
  if (typeof body.patientEmail === "string" && body.patientEmail) {
    const { data } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("email", body.patientEmail)
      .eq("user_id", ownerId)
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
  supabase: SupabaseClient,
  orgName: string,
  ownerId: string,
  personalUpload = false
) {
  const body = await readJsonObject(req, UPLOAD_BODY_LIMIT);
  const retryKey = req.headers.get("Idempotency-Key");
  if (!validRetryKey(retryKey)) return jsonResponse({ error: "Provide an Idempotency-Key of 1–128 letters, digits, dots, underscores, colons or hyphens.", code: "idempotency_key_required" }, 400);

  const patientId = personalUpload && !body.patientId && !body.patientEmail
    ? ownerId : await resolvePatientId(supabase, body, ownerId);
  if (!patientId) {
    return jsonResponse(
      {
        error: "Patient not found. Provide patientId (user_id) or patientEmail.",
      },
      404
    );
  }

  requireImportOwner(ownerId, patientId);
  await requireActiveAccount(supabase, patientId);

  let normalized: NormalizedRecord[] = [];

  // FHIR Bundle path
  if (
    body.resourceType === "Bundle" ||
    (body.records === undefined && body.entry !== undefined)
  ) {
    normalized = mapFhirBundle(body as Record<string, unknown>);
  } else {
    const rawRecords = (body.records as Array<Record<string, unknown>>) ?? [];
    if (!Array.isArray(rawRecords) || rawRecords.some(r => !r || typeof r !== "object" || Array.isArray(r))) {
      return jsonResponse({ error: "Records must be an array of objects." }, 400);
    }
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

  if (normalized.length > 20) return jsonResponse({ error: "Send at most 20 records per request." }, 400);
  let payloadHash: string;
  try { payloadHash = await batchFingerprint(normalized, orgName, personalUpload); }
  catch { return jsonResponse({ error: "Import metadata is invalid." }, 400); }
  const { data: batch, error: batchError } = await supabase.rpc("reserve_inbound_batch", {
    p_user_id: patientId, p_key_hash: await sha256(retryKey), p_payload_hash: payloadHash, p_count: normalized.length,
  });
  if (batchError || !batch) return jsonResponse({ error: "Unable to reserve this import. Retry with the same key and unchanged batch." }, 503);
  if (batch.state === "conflict") return jsonResponse({ error: "This Idempotency-Key was used with different records. Retry the original batch, or use a new key for a new import.", code: "idempotency_conflict" }, 409);
  if (batch.state !== "ready") return jsonResponse({ error: "Import reservation is unavailable." }, 503);
  const inserted: SavedRecord[] = [];
  const recordErrors: Array<{ index: number; code: string; attemptId?: string }> = [];
  for (const [index, rec] of normalized.entries()) {
    const contentType = rec.fileType === "pdf" ? "application/pdf"
      : rec.fileType === "dicom" ? "application/dicom"
      : ["jpg", "jpeg"].includes(rec.fileType) ? "image/jpeg"
      : rec.fileType === "png" ? "image/png" : "application/octet-stream";
    const result = await persistImport({
      authorize: () => requireActiveAccount(supabase, patientId),
      prepare: async (id, _path, input) => {
        const { data, error } = await supabase.rpc("reserve_inbound_record", {
          p_batch_id: batch.id, p_index: index, p_attempt_id: id, p_has_file: input.bytes !== null,
        });
        if (error || !data) throw error ?? new Error("Missing reservation");
        if (data.state === "prepared") return;
        if (data.state === "committed" || data.state === "busy") return data;
        throw new Error("Invalid reservation");
      },
      upload: async (path, bytes, contentType) => {
        const { error } = await supabase.storage.from("inbound-records").upload(path, bytes,
          { contentType, cacheControl: "0", upsert: false });
        if (error) throw error;
      },
      finalize: async (id, record) => {
        const { data, error } = await supabase.rpc("finalize_inbound_upload", { p_attempt_id: id, p_record: record });
        if (error || !data) throw error ?? new Error("Missing commit receipt");
        return data;
      },
      abandon: async (id) => {
        const { data, error } = await supabase.rpc("abandon_inbound_upload", { p_attempt_id: id });
        if (error || !data) throw error ?? new Error("Missing recovery receipt");
        return data;
      },
      remove: async (path) => {
        const { error } = await supabase.storage.from("inbound-records").remove([path]);
        if (error) throw error;
      },
    }, patientId, {
      source: personalUpload ? "uploaded" : "connected",
      kind: rec.kind, title: rec.title, provider_name: rec.providerName ?? orgName ?? null,
      service_date: rec.serviceDate ?? null, file_type: rec.fileType ?? null, fhir_ref: rec.fhirRef ?? null,
    }, rec.base64, contentType);
    if ("saved" in result) inserted.push(result.saved);
    else recordErrors.push({ index, code: result.error, ...(result.attemptId ? { attemptId: result.attemptId } : {}) });
  }
  return jsonResponse({
    success: recordErrors.length === 0,
    importBatchId: batch.id,
    received: inserted.length,
    failed: recordErrors.length,
    patientId,
    records: inserted,
    recordErrors,
    message: recordErrors.length ? "Some records were not saved. Review each result before retrying." : "Records saved.",
  }, recordErrors.length ? (inserted.length ? 207 : 422) : 200);
}

// ─── Key Management Handlers ─────────────────────────────────────────────────

async function handleCreateKey(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await readJsonObject(req, CONTROL_BODY_LIMIT);
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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

    // Signed-in app upload: never requires an integration API key in the client.
    if (req.method === "POST" && parts.length === 1 && parts[0] === "upload") {
      const userId = await requireVerifiedUser(supabase, req);
      return await handleIngest(req, supabase, "Personal upload", userId, true);
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
      return await handleIngest(req, supabase, auth.orgName, auth.ownerId);
    }

    // Key management — requires JWT
    if (parts[0] === "keys") {
      const userId = await requireVerifiedUser(supabase, req);
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
    if (err instanceof RequestBodyError) return jsonResponse({ error: err.message, code: "request_body_rejected" }, err.status);
    if (err instanceof ImportAccessError) return jsonResponse({ error: err.message }, err.status);
    return jsonResponse({ error: "Unable to process this request." }, 500);
  }
});
