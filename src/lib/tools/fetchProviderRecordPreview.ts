import type { RecordImportPreviewItem } from "../provider-record-connection/types";
import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import { syncFhirConnection } from "../network/fhir-oauth-api";

export const fetchProviderRecordPreviewInputSchema = z.object({
  userId: z.string().min(1),
  providerConnectionId: z.string().optional(),
  providerOrganizationId: z.string().optional(),
  strategy: z.string().optional(),
});
export type FetchProviderRecordPreviewInput = z.infer<typeof fetchProviderRecordPreviewInputSchema>;

// Only the authenticated backend can fetch provider data and persist its receipt.
// Unavailable connections must never produce synthetic clinical records.
export async function fetchProviderRecordPreview(input: unknown) {
  const parsed = fetchProviderRecordPreviewInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid provider preview request." };
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== parsed.data.userId) {
      return { success: false, error: "Sign in with the account that connected this provider." };
    }
    const connectionId = parsed.data.providerConnectionId;
    if (!connectionId) return { success: false, error: "Connect your provider before previewing records, or request records manually." };
    const { data: connection, error } = await supabase.from("provider_connections")
      .select("id, status").eq("id", connectionId).eq("user_id", user.id).maybeSingle();
    if (error || !connection) return { success: false, error: "Provider connection could not be verified." };
    if (connection.status !== "active") return { success: false, error: "Finish connecting your provider before previewing records." };

    const result = await syncFhirConnection(connectionId);
    if (result.source !== "fhir" || !result.importJobId || !result.itemsByType || !result.counts) {
      return { success: false, error: "The provider preview could not be saved. Please try again." };
    }
    // The server already persisted this preview. Do not create a second job here.
    return { success: true, data: {
      counts: result.counts, itemsByType: result.itemsByType as Record<string, RecordImportPreviewItem[]>,
      importJobId: result.importJobId, source: "fhir", message: result.message,
    } };
  } catch {
    return { success: false, error: "Provider records are unavailable. Please try again or request records manually." };
  }
}
