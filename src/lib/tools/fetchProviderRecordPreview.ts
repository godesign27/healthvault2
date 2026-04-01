import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";
import type {
  RecordImportPreviewItem,
  ProviderConnectionStrategy,
} from "../provider-record-connection/types";

/**
 * SCAFFOLD NOTE: This tool currently returns mock preview data when a connected
 * source exists but does not have a live FHIR token. When real FHIR connections
 * are available, it will fetch actual patient resources and normalize them.
 * The existing mock FHIR pipeline in src/lib/api/mock-fhir-api.ts and
 * src/lib/import/import-orchestrator.ts can be evolved for that purpose.
 */

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
        .select("id, provider_organization_id, status, fhir_access_token")
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

      // If a real FHIR token existed, we would fetch live data here.
      // Since tokens are not yet configured, fall through to scaffold preview.
    } else if (providerOrganizationId) {
      const { data: org } = await supabase
        .from("provider_organizations")
        .select("name")
        .eq("id", providerOrganizationId)
        .maybeSingle();

      orgName = org?.name || orgName;
    }

    // Generate scaffold preview — clearly mock data, not from a real provider
    const previewItems = generateScaffoldPreview(orgName);

    const counts = {
      conditions: previewItems.filter((i) => i.resourceType === "condition").length,
      medications: previewItems.filter((i) => i.resourceType === "medication").length,
      allergies: previewItems.filter((i) => i.resourceType === "allergy").length,
      immunizations: previewItems.filter((i) => i.resourceType === "immunization").length,
      total: previewItems.length,
      duplicates: previewItems.filter((i) => i.isDuplicate).length,
    };

    const itemsByType: Record<string, RecordImportPreviewItem[]> = {};
    for (const item of previewItems) {
      if (!itemsByType[item.resourceType]) {
        itemsByType[item.resourceType] = [];
      }
      itemsByType[item.resourceType].push(item);
    }

    // Persist an import job in "preview" state
    const { data: job, error: jobError } = await supabase
      .from("record_import_jobs")
      .insert({
        user_id: userId,
        provider_connection_id: connectionId || null,
        strategy: (parsed.data.strategy as ProviderConnectionStrategy) || "manual_fallback",
        status: "preview",
        preview_data: itemsByType,
        counts,
      })
      .select("id")
      .single();

    const importJobId = job?.id || null;
    if (jobError) {
      console.warn("Failed to persist import job:", jobError.message);
    }

    return {
      success: true,
      data: {
        counts,
        itemsByType,
        importJobId,
        source: "scaffold",
        message: `Preview generated for ${orgName}. Note: This is scaffold data — real records will be available once a live provider connection is established.`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

function generateScaffoldPreview(orgName: string): RecordImportPreviewItem[] {
  return [
    {
      resourceType: "condition",
      name: "Essential Hypertension",
      date: "2020-03-10",
      source: orgName,
      status: "Active",
      isDuplicate: false,
    },
    {
      resourceType: "condition",
      name: "Asthma",
      date: "2015-06-15",
      source: orgName,
      status: "Active",
      isDuplicate: false,
    },
    {
      resourceType: "medication",
      name: "Lisinopril 10mg",
      date: "2020-03-10",
      source: orgName,
      status: "Active",
      isDuplicate: false,
    },
    {
      resourceType: "medication",
      name: "Albuterol Inhaler 90mcg",
      date: "2015-06-15",
      source: orgName,
      status: "Active",
      isDuplicate: false,
    },
    {
      resourceType: "allergy",
      name: "Penicillin",
      date: "2005-01-15",
      source: orgName,
      status: "Active",
      isDuplicate: false,
    },
    {
      resourceType: "immunization",
      name: "COVID-19 mRNA Vaccine",
      date: "2021-04-15",
      source: orgName,
      status: "Completed",
      isDuplicate: false,
    },
    {
      resourceType: "immunization",
      name: "Influenza Vaccine (2024-2025)",
      date: "2024-10-01",
      source: orgName,
      status: "Completed",
      isDuplicate: false,
    },
  ];
}
