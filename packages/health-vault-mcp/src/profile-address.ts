import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileAddressInput = {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
};

const clean = (value?: string | null) => value?.trim() || null;
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function streetOnly(input: ProfileAddressInput): string {
  const street = input.addressLine1.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  if (!city || !state) return street;

  // Some legacy rows stored the full address in address_line1. Remove a trailing
  // locality before persisting or rendering the normalized column set.
  const trailingLocality = new RegExp(
    `\\s*,?\\s*${escapeRegExp(city)}\\s*,?\\s+${escapeRegExp(state)}(?:\\s+\\d{5}(?:-\\d{4})?)?\\s*$`,
    "i",
  );
  return street.replace(trailingLocality, "").replace(/,\s*$/, "").trim();
}

export function previewProfileAddressUpdate(input: ProfileAddressInput) {
  const normalized = {
    addressLine1: streetOnly(input),
    addressLine2: clean(input.addressLine2),
    city: input.city.trim(),
    state: input.state.trim(),
    postalCode: input.postalCode.trim(),
  };

  if (!normalized.addressLine1 || !normalized.city || !normalized.state || !normalized.postalCode) {
    throw new Error("A complete street, city, state, and postal code is required");
  }

  return {
    ...normalized,
    formattedAddress: [
      normalized.addressLine1,
      normalized.addressLine2,
      `${normalized.city}, ${normalized.state} ${normalized.postalCode}`,
    ].filter(Boolean).join(", "),
    requiresConfirmation: true as const,
  };
}

export function formatProfileAddress(input: ProfileAddressInput): string {
  return previewProfileAddressUpdate(input).formattedAddress;
}

export async function updateProfileAddress(
  supabase: SupabaseClient,
  userId: string,
  input: ProfileAddressInput,
) {
  const preview = previewProfileAddressUpdate(input);
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      address_line1: preview.addressLine1,
      address_line2: preview.addressLine2,
      city: preview.city,
      state: preview.state,
      postal_code: preview.postalCode,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("address_line1, address_line2, city, state, postal_code")
    .maybeSingle();

  if (error) throw new Error(`Unable to update profile address: ${error.message}`);
  if (!data) throw new Error("Unable to update profile address: profile not found");
  return data;
}
