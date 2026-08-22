import type { SupabaseClient } from "@supabase/supabase-js";

const clean = (value?: string | null) => value?.trim() || null;

export type LifeSignalInput = {
  energy: number;
  sleep: number;
  mood: number;
  stress: number;
  pain: number;
  note?: string;
  recordedAt?: string;
};

export function previewLifeSignal(input: LifeSignalInput) {
  return {
    energy: input.energy,
    sleep: input.sleep,
    mood: input.mood,
    stress: input.stress,
    pain: input.pain,
    note: clean(input.note),
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    scale: "1 is low and 5 is high; for stress and pain, 5 means more severe",
    requiresConfirmation: true,
    provenance: { source: "user_reported", capturedVia: "chatgpt" },
  };
}

export async function logLifeSignal(supabase: SupabaseClient, userId: string, input: LifeSignalInput) {
  const preview = previewLifeSignal(input);
  const { requiresConfirmation: _requiresConfirmation, scale: _scale, provenance: _provenance, ...value } = preview;
  const { data, error } = await supabase.from("life_signal_entries").insert({
    user_id: userId,
    energy: value.energy,
    sleep: value.sleep,
    mood: value.mood,
    stress: value.stress,
    pain: value.pain,
    note: value.note,
    recorded_at: value.recordedAt,
    source: "chatgpt",
    confirmation_status: "confirmed",
  }).select("id, energy, sleep, mood, stress, pain, note, recorded_at, source, confirmation_status").single();
  if (error) throw new Error(`Unable to save Life Signal: ${error.message}`);
  return data;
}

export async function listLifeSignals(supabase: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase.from("life_signal_entries")
    .select("id, energy, sleep, mood, stress, pain, note, recorded_at, source, confirmation_status")
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Unable to read Life Signals: ${error.message}`);
  return data ?? [];
}

export type DietLogInput = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "other";
  consumedAt?: string;
  items: Array<{ name: string; amount?: string; notes?: string }>;
  waterMl?: number;
  notes?: string;
};

export function previewDietLog(input: DietLogInput) {
  return {
    mealType: input.mealType,
    consumedAt: input.consumedAt ?? new Date().toISOString(),
    items: input.items.map((item) => ({
      name: item.name.trim(),
      amount: clean(item.amount),
      notes: clean(item.notes),
    })),
    waterMl: input.waterMl ?? null,
    notes: clean(input.notes),
    requiresConfirmation: true,
    provenance: { source: "user_reported", capturedVia: "chatgpt" },
  };
}

export async function logDietEntry(supabase: SupabaseClient, userId: string, input: DietLogInput) {
  const preview = previewDietLog(input);
  const { requiresConfirmation: _requiresConfirmation, provenance: _provenance, ...value } = preview;
  const { data, error } = await supabase.from("diet_log_entries").insert({
    user_id: userId,
    meal_type: value.mealType,
    consumed_at: value.consumedAt,
    items: value.items,
    water_ml: value.waterMl,
    notes: value.notes,
    source: "chatgpt",
    confirmation_status: "confirmed",
  }).select("id, meal_type, consumed_at, items, water_ml, notes, source, confirmation_status").single();
  if (error) throw new Error(`Unable to save diet entry: ${error.message}`);
  return data;
}

export async function getDietSummary(supabase: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase.from("diet_log_entries")
    .select("id, meal_type, consumed_at, items, water_ml, notes, source, confirmation_status")
    .gte("consumed_at", since)
    .order("consumed_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Unable to read diet log: ${error.message}`);
  const entries = data ?? [];
  const itemNames = entries.flatMap((entry) => Array.isArray(entry.items)
    ? entry.items.map((item: { name?: string }) => item.name).filter(Boolean)
    : []);
  const waterMl = entries.reduce((total, entry) => total + (Number(entry.water_ml) || 0), 0);
  const suggestions: string[] = [];
  if (!entries.length) suggestions.push("Log a meal or drink to start building a daily pattern.");
  if (entries.length && itemNames.length < entries.length * 2) suggestions.push("Add individual foods and approximate amounts when convenient so future summaries have more context.");
  if (entries.length && waterMl === 0) suggestions.push("Consider logging water or other drinks so hydration is represented in the daily summary.");
  if (entries.length) suggestions.push("Aim for variety across meals; Health Vault can summarize patterns, but it does not replace personalized advice from a clinician or dietitian.");
  return {
    periodDays: days,
    entries,
    loggedEntries: entries.length,
    loggedWaterMl: waterMl,
    observations: suggestions,
    provenance: { source: "user_reported", confirmationStatus: "confirmed" },
  };
}

