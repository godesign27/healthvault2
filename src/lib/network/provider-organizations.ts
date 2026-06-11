export interface ProviderOrganization {
  id: string;
  name: string;
  ehrVendor: string | null;
  portalBrand: string | null;
  city: string | null;
  state: string | null;
  supportsDirectConnection: boolean;
  supportsEpicConnection: boolean;
  supportsManualRequest: boolean;
}

export type ProviderOrganizationRow = {
  id: string;
  name: string;
  ehr_vendor: string | null;
  portal_brand: string | null;
  city: string | null;
  state: string | null;
  supports_direct_connection: boolean;
  supports_epic_connection: boolean;
  supports_manual_request: boolean;
};

export function mapOrganizationRow(row: ProviderOrganizationRow): ProviderOrganization {
  return {
    id: row.id,
    name: row.name,
    ehrVendor: row.ehr_vendor || null,
    portalBrand: row.portal_brand || null,
    city: row.city || null,
    state: row.state || null,
    supportsDirectConnection: row.supports_direct_connection,
    supportsEpicConnection: row.supports_epic_connection,
    supportsManualRequest: row.supports_manual_request,
  };
}

export function organizationSearchFilter(query: string): string {
  const q = query.trim();
  return `name.ilike.%${q}%,ehr_vendor.ilike.%${q}%,portal_brand.ilike.%${q}%,city.ilike.%${q}%`;
}

export function formatOrganizationLocation(org: ProviderOrganization): string {
  return [org.city, org.state].filter(Boolean).join(', ');
}

export function organizationSpecialtyLabel(org: ProviderOrganization): string {
  if (org.portalBrand && org.ehrVendor) {
    return `${org.ehrVendor} • ${org.portalBrand}`;
  }
  return org.ehrVendor || org.portalBrand || 'Healthcare Organization';
}
