import type { SupabaseClient } from "@supabase/supabase-js";

function fail(label: string, error: { message: string } | null): void {
  if (error) throw new Error(`Unable to read ${label}: ${error.message}`);
}

export async function getConditions(supabase: SupabaseClient, activeOnly: boolean) {
  let query = supabase
    .from("conditions")
    .select("id, name, status, diagnosed_on, managing_physician, notes")
    .order("created_at", { ascending: false })
    .limit(25);
  if (activeOnly) query = query.eq("status", "Active");
  const { data, error } = await query;
  fail("conditions", error);
  return data ?? [];
}

export async function getMedications(supabase: SupabaseClient, activeOnly: boolean) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("medications")
    .select("id, name, dosage, frequency, prescribed_by, start_date, end_date")
    .order("created_at", { ascending: false })
    .limit(25);
  fail("medications", error);
  const rows = data ?? [];
  return activeOnly ? rows.filter((row) => !row.end_date || row.end_date >= today) : rows;
}

export async function getAllergies(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("allergies")
    .select("id, allergen, reaction, severity")
    .order("created_at", { ascending: false })
    .limit(25);
  fail("allergies", error);
  return data ?? [];
}

export async function getHealthRecords(supabase: SupabaseClient, limit: number) {
  const { data, error } = await supabase
    .from("health_records")
    .select("id, title, kind, provider_name, service_date, received_at")
    .order("service_date", { ascending: false, nullsFirst: false })
    .limit(limit);
  fail("health records", error);
  return data ?? [];
}
