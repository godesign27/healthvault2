import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getConnectedInsuranceInputSchema = z.object({
  userId: z.string().min(1),
});

export async function getConnectedInsurance(input: unknown) {
  const parsed = getConnectedInsuranceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;

    const { data, error } = await supabase
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

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    const insurance = (data || []).map((row: any) => ({
      id: row.id,
      insuranceProviderId: row.insurance_providers?.id || null,
      providerName: row.insurance_providers?.name || "Unknown",
      providerLogoUrl: row.insurance_providers?.logo_url || null,
      planName: row.plan_name,
      memberId: row.member_id_hash,
      groupNumber: row.group_number,
      effectiveStart: row.effective_start,
      effectiveEnd: row.effective_end,
      isPrimary: row.is_primary,
      status: row.coverage_status,
      verificationStatus: row.verification_status,
      connectionStatus: row.coverage_status === "active" ? "connected" : "inactive",
    }));

    const activeCount = insurance.filter((i: any) => i.status === "active").length;

    return {
      success: true,
      data: {
        total: insurance.length,
        activeCount,
        insurance,
        summary: activeCount > 0
          ? `You have ${activeCount} active insurance plan${activeCount !== 1 ? "s" : ""}. This can be used to find in-network providers.`
          : "No active insurance found. You can still search for providers, but in-network filtering won't be available.",
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
