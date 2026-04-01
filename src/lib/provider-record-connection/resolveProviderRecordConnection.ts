import { createSupabaseServerClient } from "../supabase/server";
import type {
  ProviderConnectionStrategy,
  ProviderConnectionSummary,
  ProviderOrganizationSummary,
  ProviderRecordConnectionResolution,
} from "./types";

interface ResolveInput {
  userId: string;
  providerName?: string;
  providerOrganizationId?: string;
  careNetworkProviderId?: string;
}

export async function resolveProviderRecordConnection(
  input: ResolveInput
): Promise<ProviderRecordConnectionResolution> {
  const supabase = createSupabaseServerClient();
  const { userId, providerName, providerOrganizationId, careNetworkProviderId } =
    input;

  try {
    // 1. If a specific org is targeted, check for existing connection first
    if (providerOrganizationId) {
      const existing = await findExistingConnection(
        supabase,
        userId,
        providerOrganizationId
      );
      if (existing) {
        const org = await fetchOrganization(supabase, providerOrganizationId);
        return success("existing_connection", org, existing, {
          reason: `You already have an active connection to ${org?.name || "this provider"}.`,
          nextAction: "Use your existing connection to sync records.",
        });
      }

      const org = await fetchOrganization(supabase, providerOrganizationId);
      if (org) {
        return resolveFromOrganization(org);
      }
    }

    // 2. If a care-network provider ID is given, look up the provider's org association
    if (careNetworkProviderId) {
      const { data: provider } = await supabase
        .from("providers")
        .select("name, clinic")
        .eq("id", careNetworkProviderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (provider) {
        const orgMatch = await searchOrgByName(
          supabase,
          provider.clinic || provider.name
        );
        if (orgMatch) {
          const existing = await findExistingConnection(
            supabase,
            userId,
            orgMatch.id
          );
          if (existing) {
            return success("existing_connection", orgMatch, existing, {
              reason: `You already have an active connection to ${orgMatch.name}.`,
              nextAction: "Use your existing connection to sync records.",
            });
          }
          return resolveFromOrganization(orgMatch);
        }
      }
    }

    // 3. If a provider name is given, try to match it to an organization
    if (providerName) {
      const orgMatch = await searchOrgByName(supabase, providerName);
      if (orgMatch) {
        const existing = await findExistingConnection(
          supabase,
          userId,
          orgMatch.id
        );
        if (existing) {
          return success("existing_connection", orgMatch, existing, {
            reason: `You already have an active connection to ${orgMatch.name}.`,
            nextAction: "Use your existing connection to sync records.",
          });
        }
        return resolveFromOrganization(orgMatch);
      }
    }

    // 4. No match found — manual fallback
    return success("manual_fallback", null, null, {
      reason: providerName
        ? `No matching provider organization found for "${providerName}".`
        : "No provider specified or no matching organization found.",
      nextAction:
        "You can request records manually, or search for your provider organization by name.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

function resolveFromOrganization(
  org: ProviderOrganizationSummary
): ProviderRecordConnectionResolution {
  if (org.supportsDirectConnection) {
    return success("direct_provider_connection", org, null, {
      reason: `${org.name} supports a direct connection via ${org.ehrVendor || "their EHR"}.`,
      nextAction: "Start the direct provider connection to import records.",
    });
  }

  if (org.supportsEpicConnection) {
    return success("epic_connection", org, null, {
      reason: `${org.name} supports connection through ${org.portalBrand || "their patient portal"}.`,
      nextAction: "Start the provider portal connection to import records.",
    });
  }

  return success("manual_fallback", org, null, {
    reason: `${org.name} does not yet support digital record exchange.`,
    nextAction:
      "You can submit a manual records request to this provider.",
  });
}

async function findExistingConnection(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  orgId: string
): Promise<ProviderConnectionSummary | null> {
  const { data } = await supabase
    .from("provider_connections")
    .select(
      "id, user_id, provider_organization_id, connection_method, status, last_synced_at, created_at"
    )
    .eq("user_id", userId)
    .eq("provider_organization_id", orgId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;

  const { data: org } = await supabase
    .from("provider_organizations")
    .select("name")
    .eq("id", data.provider_organization_id)
    .maybeSingle();

  return {
    id: data.id,
    userId: data.user_id,
    providerOrganizationId: data.provider_organization_id,
    providerOrganizationName: org?.name || "Unknown",
    connectionMethod: data.connection_method as ProviderConnectionStrategy,
    status: data.status,
    lastSyncedAt: data.last_synced_at,
    createdAt: data.created_at,
  };
}

async function fetchOrganization(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  orgId: string
): Promise<ProviderOrganizationSummary | null> {
  const { data } = await supabase
    .from("provider_organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();

  if (!data) return null;
  return mapOrgRow(data);
}

async function searchOrgByName(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  name: string
): Promise<ProviderOrganizationSummary | null> {
  const { data } = await supabase
    .from("provider_organizations")
    .select("*")
    .ilike("name", `%${name}%`)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapOrgRow(data);
}

function mapOrgRow(row: Record<string, unknown>): ProviderOrganizationSummary {
  return {
    id: row.id as string,
    name: row.name as string,
    ehrVendor: (row.ehr_vendor as string) || null,
    portalBrand: (row.portal_brand as string) || null,
    fhirEndpointUrl: (row.fhir_endpoint_url as string) || null,
    supportsDirectConnection: row.supports_direct_connection as boolean,
    supportsEpicConnection: row.supports_epic_connection as boolean,
    supportsManualRequest: row.supports_manual_request as boolean,
  };
}

function success(
  strategy: ProviderConnectionStrategy,
  org: ProviderOrganizationSummary | null,
  conn: ProviderConnectionSummary | null,
  meta: { reason: string; nextAction: string }
): ProviderRecordConnectionResolution {
  return {
    success: true,
    data: {
      strategy,
      providerOrganization: org,
      existingConnection: conn,
      reason: meta.reason,
      nextAction: meta.nextAction,
    },
  };
}
