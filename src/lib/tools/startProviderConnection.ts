import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const startProviderConnectionInputSchema = z.object({
  userId: z.string().min(1),
  providerOrganizationId: z.string().min(1),
});

export type StartProviderConnectionInput = z.infer<
  typeof startProviderConnectionInputSchema
>;

export async function startProviderConnection(input: unknown) {
  const parsed = startProviderConnectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, providerOrganizationId } = parsed.data;

    const { data: org, error: orgError } = await supabase
      .from("provider_organizations")
      .select("*")
      .eq("id", providerOrganizationId)
      .maybeSingle();

    if (orgError) {
      return { success: false, error: `Database error: ${orgError.message}` };
    }

    if (!org) {
      return { success: false, error: "Provider organization not found." };
    }

    if (!org.supports_direct_connection) {
      return {
        success: true,
        data: {
          strategy: "direct_provider_connection",
          status: "not_configured",
          launchUrl: null,
          message: `${org.name} does not yet support direct digital connection. The FHIR endpoint and credentials have not been configured. You can submit a manual records request instead.`,
        },
      };
    }

    if (!org.fhir_endpoint_url) {
      return {
        success: true,
        data: {
          strategy: "direct_provider_connection",
          status: "not_configured",
          launchUrl: null,
          message: `${org.name} supports direct connection but the FHIR endpoint has not been configured yet. This will be available once provider onboarding is complete.`,
        },
      };
    }

    // When real SMART on FHIR credentials are configured, this would
    // generate an authorization URL and return it as launchUrl.
    // For now, create a pending connection record.
    const { data: connection, error: connError } = await supabase
      .from("provider_connections")
      .insert({
        user_id: userId,
        provider_organization_id: providerOrganizationId,
        connection_method: "direct_provider_connection",
        status: "pending",
      })
      .select("id")
      .single();

    if (connError) {
      return { success: false, error: `Failed to create connection: ${connError.message}` };
    }

    return {
      success: true,
      data: {
        strategy: "direct_provider_connection",
        status: "pending",
        connectionId: connection.id,
        launchUrl: null,
        message: `Connection to ${org.name} initiated. The authorization flow is pending configuration. Once SMART on FHIR credentials are available, you will be redirected to authorize access.`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
