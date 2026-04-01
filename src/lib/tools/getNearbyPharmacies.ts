import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

/**
 * SCAFFOLD NOTE: This tool currently returns pharmacies from the user's saved
 * pharmacy list. When a real pharmacy directory API (e.g. GoodRx, Surescripts)
 * is integrated, this should query that source and sort by proximity to the
 * patient's address. Distance and coordinates are returned as null until then.
 */

export const getNearbyPharmaciesInputSchema = z.object({
  userId: z.string().min(1),
  query: z.string().optional(),
  radiusMiles: z.number().optional(),
  limit: z.number().default(20),
});

export async function getNearbyPharmacies(input: unknown) {
  const parsed = getNearbyPharmaciesInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, query, limit } = parsed.data;

    // Resolve patient address: prefer active address from user_addresses,
    // fall back to user_profiles legacy address fields
    let addressContext: Record<string, unknown> | null = null;

    const { data: activeAddress } = await supabase
      .from("user_addresses")
      .select("address_line1, address_line2, city, state, postal_code, label")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (activeAddress?.address_line1 && activeAddress?.city) {
      const parts = [activeAddress.address_line1];
      if (activeAddress.address_line2) parts.push(activeAddress.address_line2);
      parts.push(`${activeAddress.city}, ${activeAddress.state || ""} ${activeAddress.postal_code || ""}`.trim());
      addressContext = {
        fullAddress: parts.join(", "),
        city: activeAddress.city,
        state: activeAddress.state,
        postalCode: activeAddress.postal_code,
        source: "user_addresses",
        label: activeAddress.label,
      };
    }

    if (!addressContext) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("address_line1, address_line2, city, state, postal_code")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.address_line1 && profile?.city) {
        const parts = [profile.address_line1];
        if (profile.address_line2) parts.push(profile.address_line2);
        parts.push(`${profile.city}, ${profile.state || ""} ${profile.postal_code || ""}`.trim());
        addressContext = {
          fullAddress: parts.join(", "),
          city: profile.city,
          state: profile.state,
          postalCode: profile.postal_code,
          source: "user_profiles",
        };
      }
    }

    let dbQuery = supabase
      .from("pharmacies")
      .select("*")
      .eq("user_id", userId)
      .order("preferred", { ascending: false })
      .order("name", { ascending: true })
      .limit(limit);

    if (query) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%,chain.ilike.%${query}%,address.ilike.%${query}%`
      );
    }

    const { data, error } = await dbQuery;

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    const pharmacies = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      chain: row.chain || null,
      address: row.address || null,
      phone: row.phone || null,
      isPreferred: row.preferred,
      inNetwork: row.in_network ?? null,
      deliveryOptions: row.delivery_options || [],
      distanceMiles: null,
      latitude: null,
      longitude: null,
    }));

    const noAddress = !addressContext;

    return {
      success: true,
      data: {
        addressContext,
        total: pharmacies.length,
        pharmacies,
        source: "saved_pharmacies",
        message: noAddress
          ? "No address on file. Add your address in your profile to enable proximity-based pharmacy search."
          : pharmacies.length === 0
            ? "No saved pharmacies found. You can add pharmacies to your profile."
            : undefined,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
