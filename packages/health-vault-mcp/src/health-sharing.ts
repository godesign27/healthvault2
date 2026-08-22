import type { SupabaseClient } from "@supabase/supabase-js";

export const HEALTH_SHARE_CATEGORIES = [
  "conditions",
  "medications",
  "allergies",
  "records",
  "appointments",
  "medical_id",
] as const;

export type HealthShareCategory = typeof HEALTH_SHARE_CATEGORIES[number];

export type HealthShareInput = {
  recipientName: string;
  recipientOrganization?: string;
  categories: HealthShareCategory[];
  expiresInDays: number;
  note?: string;
};

const clean = (value?: string | null) => value?.trim() || null;

export function previewHealthShare(input: HealthShareInput) {
  const categories = [...new Set(input.categories)];
  if (!categories.length) throw new Error("Choose at least one health-data category to share");
  if (input.expiresInDays < 1 || input.expiresInDays > 30) {
    throw new Error("Share links must expire between 1 and 30 days after creation");
  }
  return {
    recipientName: input.recipientName.trim(),
    recipientOrganization: clean(input.recipientOrganization),
    categories,
    expiresInDays: input.expiresInDays,
    note: clean(input.note),
    alwaysIncluded: ["patient name"],
    canBeRevoked: true,
    requiresConfirmation: true,
  };
}

async function getSnapshot(supabase: SupabaseClient, categories: HealthShareCategory[]) {
  const selected = new Set(categories);
  const queries: Array<PromiseLike<{ data: unknown; error: { message: string } | null }>> = [];
  const keys: HealthShareCategory[] = [];
  const add = (key: HealthShareCategory, query: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
    keys.push(key);
    queries.push(query);
  };

  if (selected.has("conditions")) add("conditions", supabase.from("conditions").select("name, status, diagnosed_on, managing_physician, notes").order("created_at", { ascending: false }).limit(50));
  if (selected.has("medications")) add("medications", supabase.from("medications").select("name, dosage, frequency, prescribed_by, start_date, end_date, notes").order("created_at", { ascending: false }).limit(50));
  if (selected.has("allergies")) add("allergies", supabase.from("allergies").select("allergen, reaction, severity, diagnosed_on, notes").order("created_at", { ascending: false }).limit(50));
  if (selected.has("records")) add("records", supabase.from("health_records").select("title, kind, provider_name, service_date, ai_summary, tags").order("service_date", { ascending: false, nullsFirst: false }).limit(50));
  if (selected.has("appointments")) add("appointments", supabase.from("appointments").select("provider_name, appointment_type, scheduled_at, location, status, notes").order("scheduled_at", { ascending: false }).limit(50));
  if (selected.has("medical_id")) add("medical_id", supabase.from("user_profiles").select("first_name, last_name, date_of_birth, email, phone, address_line1, address_line2, city, state, postal_code").maybeSingle());

  const results = await Promise.all(queries);
  const snapshot: Record<string, unknown> = {};
  results.forEach((result, index) => {
    const key = keys[index];
    if (!key) return;
    if (result.error) throw new Error(`Unable to prepare ${key} for sharing: ${result.error.message}`);
    snapshot[key] = result.data ?? (key === "medical_id" ? null : []);
  });
  return snapshot;
}

export async function createHealthShare(
  supabase: SupabaseClient,
  userId: string,
  appUrl: string,
  input: HealthShareInput,
) {
  const preview = previewHealthShare(input);
  const snapshot = await getSnapshot(supabase, preview.categories);
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .maybeSingle();
  if (profileError) throw new Error(`Unable to prepare patient identity for sharing: ${profileError.message}`);
  const patientName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Health Vault member";
  const shareId = crypto.randomUUID();
  const shareToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + preview.expiresInDays * 86_400_000).toISOString();
  const { error } = await supabase.from("share_events").insert({
    id: shareId,
    patient_id: userId,
    form_response_ids: [],
    method: "SecureLink",
    recipient: {
      displayName: preview.recipientName,
      orgName: preview.recipientOrganization,
      patientName,
    },
    status: "delivered",
    sent_at: new Date().toISOString(),
    expires_at: expiresAt,
    note: preview.note,
    options: {
      healthShare: {
        version: 1,
        categories: preview.categories,
        snapshot,
        capturedAt: new Date().toISOString(),
      },
    },
    audit: [{ event: "created", at: new Date().toISOString(), actor: "patient" }],
    share_token: shareToken,
    is_revoked: false,
  });
  if (error) throw new Error(`Unable to create secure share: ${error.message}`);

  return {
    id: shareId,
    shareUrl: `${appUrl.replace(/\/$/, "")}/share/${shareId}?token=${shareToken}`,
    recipientName: preview.recipientName,
    categories: preview.categories,
    expiresAt,
    canBeRevoked: true,
  };
}

export async function revokeHealthShare(supabase: SupabaseClient, shareId: string) {
  const { data, error } = await supabase.from("share_events")
    .update({ status: "revoked", is_revoked: true, revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("is_revoked", false)
    .select("id, status, revoked_at")
    .single();
  if (error) throw new Error(`Unable to revoke secure share: ${error.message}`);
  return data;
}
