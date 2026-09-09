import type { ProviderOrganization } from '../network/provider-organizations';

export const EPIC_SANDBOX_PROVIDER_ID = '00000000-0000-4000-8000-000000000604';
export const EPIC_SANDBOX_PROVIDER_NAME = 'Epic Sandbox (Test Patients)';

export const EPIC_SANDBOX_PROVIDER: ProviderOrganization = {
  id: EPIC_SANDBOX_PROVIDER_ID,
  name: EPIC_SANDBOX_PROVIDER_NAME,
  ehrVendor: 'Epic',
  portalBrand: 'MyChart Sandbox',
  city: null,
  state: null,
  supportsDirectConnection: false,
  supportsEpicConnection: true,
  supportsManualRequest: false,
};

export function queryMatchesEpicSandbox(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return ['epic', 'sandbox', 'test patient', 'mychart'].some((term) =>
    term.includes(normalized) || normalized.includes(term),
  );
}
