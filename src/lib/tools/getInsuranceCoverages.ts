import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getInsuranceCoveragesInputSchema = z.object({
  userId: z.string().min(1),
  activeOnly: z.boolean().default(false),
});

export type GetInsuranceCoveragesInput = z.infer<typeof getInsuranceCoveragesInputSchema>;

export async function getInsuranceCoverages(input: unknown) {
  const parsed = getInsuranceCoveragesInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, activeOnly } = parsed.data;

    let query = supabase
      .from("insurance_coverages")
      .select(`
        id,
        plan_name,
        member_id_hash,
        group_number,
        relationship,
        effective_start,
        effective_end,
        is_primary,
        coverage_status,
        verification_status,
        source,
        insurance_providers!inner (
          id,
          name,
          logo_url
        )
      `)
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("effective_start", { ascending: false });

    if (activeOnly) {
      query = query.eq("coverage_status", "active");
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const coverages = (data || []).map((row: any) => ({
      id: row.id,
      providerName: row.insurance_providers?.name || "Unknown",
      providerLogoUrl: row.insurance_providers?.logo_url || null,
      planName: row.plan_name,
      memberId: row.member_id_hash,
      groupNumber: row.group_number,
      relationship: row.relationship,
      effectiveStart: row.effective_start,
      effectiveEnd: row.effective_end,
      isPrimary: row.is_primary,
      coverageStatus: row.coverage_status,
      verificationStatus: row.verification_status,
      source: row.source,
    }));

    return {
      success: true,
      data: {
        total: coverages.length,
        coverages,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
