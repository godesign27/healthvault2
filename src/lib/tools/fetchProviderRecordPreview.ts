import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import { syncFhirConnection } from "../network/fhir-oauth-api";
import type {
  RecordImportPreviewItem,
  ProviderConnectionStrategy,
} from "../provider-record-connection/types";

/** Returns only live FHIR data from an authenticated, active connection. */

export const fetchProviderRecordPreviewInputSchema = z.object({
  userId: z.string().min(1),
  providerConnectionId: z.string().optional(),
  providerOrganizationId: z.string().optional(),
  strategy: z.string().optional(),
});

export type FetchProviderRecordPreviewInput = z.infer<
  typeof fetchProviderRecordPreviewInputSchema
>;

export async function fetchProviderRecordPreview(input: unknown) {
  const parsed = fetchProviderRecordPreviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, providerConnectionId, providerOrganizationId } = parsed.data;

    let connectionId = providerConnectionId;
    let orgName = "Unknown Provider";

    if (connectionId) {
      const { data: conn } = await supabase
        .from("provider_connections")
        .select("id, provider_organization_id, status")
        .eq("id", connectionId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!conn) {
        return { success: false, error: "Provider connection not found." };
      }

      if (conn.status !== "active") {
        return {
          success: true,
          data: {
            counts: { conditions: 0, medications: 0, allergies: 0, immunizations: 0, total: 0, duplicates: 0 },
            itemsByType: {},
            importJobId: null,
            message: `This provider connection is currently "${conn.status}". Records cannot be previewed until the connection is active.`,
          },
        };
      }

      const { data: org } = await supabase
        .from("provider_organizations")
        .select("name")
        .eq("id", conn.provider_organization_id)
        .maybeSingle();

      orgName = org?.name || orgName;

      if (conn.fhir_access_token) {
        try {
          const syncResult = await syncFhirConnection(connectionId);
          const counts = syncResult.counts;
          const itemsByType = syncResult.itemsByType as Record<string, RecordImportPreviewItem[]>;

          const { data: job, error: jobError } = await supabase
            .from("record_import_jobs")
            .insert({
              user_id: userId,
              provider_connection_id: connectionId,
              strategy: (parsed.data.strategy as ProviderConnectionStrategy) || "direct_provider_connection",
              status: "preview",
              preview_data: itemsByType,
              counts,
            })
            .select("id")
            .single();

          if (jobError) {
            console.warn("Failed to persist import job:", jobError.message);
          }

          return {
            success: true,
            data: {
              counts,
              itemsByType,
              importJobId: job?.id || syncResult.importJobId,
              source: "fhir",
              message: syncResult.message || `Fetched ${counts.total} records from ${orgName}.`,
            },
          };
        } catch (syncErr) {
          const message = syncErr instanceof Error ? syncErr.message : "Live provider sync failed.";
          return { success: false, error: message };
        }
      }

      return {
        success: false,
        error: "This connection does not have an active provider authorization token.",
      };
    } else if (providerOrganizationId) {
      const { data: org } = await supabase
        .from("provider_organizations")
        .select("name")
        .eq("id", providerOrganizationId)
        .maybeSingle();

      orgName = org?.name || orgName;
    }

    return {
      success: false,
      error: `Connect and authorize ${orgName} before retrieving records. No records were retrieved or saved.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
