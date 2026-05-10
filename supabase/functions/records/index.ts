import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function rowToRecord(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    providerName: r.provider_name ?? null,
    serviceDate: r.service_date ?? null,
    kind: r.kind,
    source: r.source,
    fileType: r.file_type ?? null,
    fileSizeBytes: r.file_size_bytes ?? null,
    previewUrl: r.preview_url ?? null,
    tags: r.tags ?? [],
    aiSummary: r.ai_summary ?? null,
    fhirRef: r.fhir_ref ?? null,
    createdAt: r.created_at,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    // Validate JWT and get user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const sb = createClient(supabaseUrl, serviceKey);
    const url = new URL(req.url);

    // Path: /functions/v1/records[/:id]
    const parts = url.pathname.split("/").filter(Boolean).slice(1);
    const recordId = parts[0] ?? null;

    // Log X-Platform for analytics
    const platform = req.headers.get("X-Platform") ?? "unknown";
    console.log(`records ${req.method} platform=${platform} user=${user.id}`);

    // ── GET /records — list ──────────────────────────────────────────────────
    if (req.method === "GET" && !recordId) {
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
      const pageSize = Math.min(100, parseInt(url.searchParams.get("pageSize") ?? "50"));
      const offset = (page - 1) * pageSize;
      const kind = url.searchParams.get("kind") ?? url.searchParams.get("type") ?? null;
      const source = url.searchParams.get("source") ?? null;

      let query = sb
        .from("health_records")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (kind) query = query.eq("kind", kind);
      if (source) query = query.eq("source", source);

      const { data, count, error } = await query;
      if (error) return json({ error: error.message }, 500);

      return json({
        items: (data ?? []).map(rowToRecord),
        total: count ?? 0,
        page,
        pageSize,
      });
    }

    // ── GET /records/:id ─────────────────────────────────────────────────────
    if (req.method === "GET" && recordId) {
      const { data, error } = await sb
        .from("health_records")
        .select("*")
        .eq("id", recordId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Record not found" }, 404);
      return json(rowToRecord(data));
    }

    // ── POST /records — create ───────────────────────────────────────────────
    if (req.method === "POST" && !recordId) {
      const body = await req.json() as Record<string, unknown>;
      const { title, kind, providerName, serviceDate, tags, notes } = body as {
        title?: string;
        kind?: string;
        providerName?: string;
        serviceDate?: string;
        tags?: string[];
        notes?: string;
      };

      if (!title || !kind) return json({ error: "title and kind are required" }, 400);

      const { data, error } = await sb
        .from("health_records")
        .insert({
          user_id: user.id,
          title,
          kind,
          provider_name: providerName ?? null,
          service_date: serviceDate ?? null,
          source: "uploaded",
          tags: tags ?? [],
          ai_summary: notes ?? null,
        })
        .select("*")
        .single();

      if (error) return json({ error: error.message }, 500);
      return json(rowToRecord(data), 201);
    }

    // ── PUT /records/:id — update ────────────────────────────────────────────
    if (req.method === "PUT" && recordId) {
      const body = await req.json() as Record<string, unknown>;
      const updates: Record<string, unknown> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.kind !== undefined) updates.kind = body.kind;
      if (body.providerName !== undefined) updates.provider_name = body.providerName;
      if (body.serviceDate !== undefined) updates.service_date = body.serviceDate;
      if (body.tags !== undefined) updates.tags = body.tags;

      if (!Object.keys(updates).length) return json({ error: "No fields to update" }, 400);

      const { data, error } = await sb
        .from("health_records")
        .update(updates)
        .eq("id", recordId)
        .eq("user_id", user.id)
        .select("*")
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Record not found" }, 404);
      return json(rowToRecord(data));
    }

    // ── DELETE /records/:id ──────────────────────────────────────────────────
    if (req.method === "DELETE" && recordId) {
      const { error } = await sb
        .from("health_records")
        .delete()
        .eq("id", recordId)
        .eq("user_id", user.id);

      if (error) return json({ error: error.message }, 500);
      return json({ deleted: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
