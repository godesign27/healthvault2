import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

/**
 * SCAFFOLD NOTE: In-network status is currently based on the `in_network` flag
 * stored on each provider in the user's care network. When a real insurer
 * provider directory API is integrated, this tool should cross-reference results
 * against the user's active insurance plan for live in-network verification.
 */

export const searchInNetworkProvidersInputSchema = z.object({
  userId: z.string().min(1),
  query: z.string().optional(),
  specialty: z.string().optional(),
  insuranceId: z.string().optional(),
  limit: z.number().default(20),
});

export async function searchInNetworkProviders(input: unknown) {
  const parsed = searchInNetworkProvidersInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, query, specialty, insuranceId, limit } = parsed.data;

    let insuranceContext: Record<string, unknown> | null = null;

    if (insuranceId) {
      const { data: coverage } = await supabase
        .from("insurance_coverages")
        .select(`
          id, plan_name, coverage_status,
          insurance_providers!inner ( name )
        `)
        .eq("id", insuranceId)
        .eq("user_id", userId)
        .maybeSingle();

      if (coverage) {
        insuranceContext = {
          insuranceId: coverage.id,
          providerName: (coverage as any).insurance_providers?.name || "Unknown",
          planName: coverage.plan_name,
          status: coverage.coverage_status,
        };
      }
    } else {
      const { data: primaryCoverage } = await supabase
        .from("insurance_coverages")
        .select(`
          id, plan_name, coverage_status,
          insurance_providers!inner ( name )
        `)
        .eq("user_id", userId)
        .eq("coverage_status", "active")
        .eq("is_primary", true)
        .maybeSingle();

      if (primaryCoverage) {
        insuranceContext = {
          insuranceId: primaryCoverage.id,
          providerName: (primaryCoverage as any).insurance_providers?.name || "Unknown",
          planName: primaryCoverage.plan_name,
          status: primaryCoverage.coverage_status,
        };
      }
    }

    let dbQuery = supabase
      .from("providers")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true })
      .limit(limit);

    if (specialty) {
      dbQuery = dbQuery.ilike("specialty", `%${specialty}%`);
    }

    if (query) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%,specialty.ilike.%${query}%,clinic.ilike.%${query}%`
      );
    }

    const { data, error } = await dbQuery;

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    const providers = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty || null,
      clinic: row.clinic || null,
      address: row.address || null,
      phone: row.phone || null,
      email: row.email || null,
      relationship: row.relationship || null,
      inNetwork: row.in_network ?? null,
      insuranceLabel: insuranceContext && row.in_network
        ? `In-network with ${(insuranceContext as any).providerName}`
        : row.in_network === false
          ? "Out of network"
          : null,
      connectionSource: row.connection_source,
      lastVisitDate: row.last_visit_date || null,
      acceptingNewPatients: null,
      distanceMiles: null,
    }));

    return {
      success: true,
      data: {
        insuranceContext,
        total: providers.length,
        providers,
        source: "care_network",
        message: providers.length === 0
          ? `No providers found${query ? ` matching "${query}"` : ""}. You can add providers to your care network.`
          : undefined,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
