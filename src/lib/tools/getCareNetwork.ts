import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getCareNetworkInputSchema = z.object({
  userId: z.string().min(1),
});

export async function getCareNetwork(input: unknown) {
  const parsed = getCareNetworkInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;

    // Fetch all providers
    const { data: providers, error: provErr } = await supabase
      .from("providers")
      .select("id, name, specialty, clinic, phone, address, relationship, connection_source, in_network, last_visit_date")
      .eq("user_id", userId)
      .order("relationship", { ascending: true })
      .order("name", { ascending: true });

    if (provErr) {
      return { success: false, error: `Database error: ${provErr.message}` };
    }

    // Fetch preferred pharmacy
    const { data: pharmacies, error: pharmErr } = await supabase
      .from("pharmacies")
      .select("id, name, chain, phone, address, preferred, delivery_options, in_network")
      .eq("user_id", userId)
      .order("preferred", { ascending: false })
      .order("name", { ascending: true });

    if (pharmErr) {
      return { success: false, error: `Database error: ${pharmErr.message}` };
    }

    const allProviders = (providers || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty || null,
      clinic: row.clinic || null,
      phone: row.phone || null,
      address: row.address || null,
      relationship: row.relationship || null,
      connectionSource: row.connection_source,
      inNetwork: row.in_network ?? null,
      lastVisitDate: row.last_visit_date || null,
    }));

    const primaryCare = allProviders.filter((p: any) => p.relationship === "Primary");
    const specialists = allProviders.filter((p: any) => p.relationship !== "Primary");

    const allPharmacies = (pharmacies || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      chain: row.chain || null,
      phone: row.phone || null,
      address: row.address || null,
      preferred: row.preferred,
      deliveryOptions: row.delivery_options || [],
      inNetwork: row.in_network ?? null,
    }));

    const preferredPharmacy = allPharmacies.find((p: any) => p.preferred) || null;

    return {
      success: true,
      data: {
        primaryCare,
        specialists,
        allProviders,
        preferredPharmacy,
        allPharmacies,
        counts: {
          totalProviders: allProviders.length,
          primaryCare: primaryCare.length,
          specialists: specialists.length,
          pharmacies: allPharmacies.length,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
