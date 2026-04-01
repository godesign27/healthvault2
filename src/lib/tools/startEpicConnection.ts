import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const startEpicConnectionInputSchema = z.object({
  userId: z.string().min(1),
  providerOrganizationId: z.string().min(1),
});

export type StartEpicConnectionInput = z.infer<
  typeof startEpicConnectionInputSchema
>;

export async function startEpicConnection(input: unknown) {
  const parsed = startEpicConnectionInputSchema.safeParse(input);
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

    if (!org.supports_epic_connection) {
      return {
        success: true,
        data: {
          strategy: "epic_connection",
          status: "not_supported",
          launchUrl: null,
          message: `${org.name} does not support connection through an Epic/MyChart-compatible portal. You can submit a manual records request instead.`,
        },
      };
    }

    // When real Epic OAuth credentials (client_id, etc.) are configured,
    // this would build an Epic authorization URL and return it as launchUrl.
    // For now, create a pending connection record.
    const { data: connection, error: connError } = await supabase
      .from("provider_connections")
      .insert({
        user_id: userId,
        provider_organization_id: providerOrganizationId,
        connection_method: "epic_connection",
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
        strategy: "epic_connection",
        status: "pending",
        connectionId: connection.id,
        launchUrl: null,
        message: `${org.name} uses ${org.portal_brand || "a patient portal"} powered by Epic. The connection is pending configuration. Once Epic OAuth credentials are registered, you will be redirected to your patient portal to authorize access.`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
