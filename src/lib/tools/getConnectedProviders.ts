import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getConnectedProvidersInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetConnectedProvidersInput = z.infer<typeof getConnectedProvidersInputSchema>;

export async function getConnectedProviders(input: unknown) {
  const parsed = getConnectedProvidersInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;

    const { data: connections, error } = await supabase
      .from("provider_connections")
      .select(`
        id,
        provider_organization_id,
        connection_method,
        status,
        last_synced_at,
        created_at,
        provider_organizations (
          id,
          name,
          ehr_vendor,
          portal_brand
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    const providers = (connections || []).map((row: any) => ({
      id: row.id,
      providerOrganizationId: row.provider_organization_id,
      name: row.provider_organizations?.name || "Unknown Organization",
      ehrVendor: row.provider_organizations?.ehr_vendor || null,
      portalBrand: row.provider_organizations?.portal_brand || null,
      connectionMethod: row.connection_method,
      status: row.status,
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
    }));

    return {
      success: true,
      data: {
        total: providers.length,
        providers,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
