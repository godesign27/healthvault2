export type ProviderAccountStatus = 'pending' | 'active' | 'suspended' | 'offboarded';
export type ProviderConnectionStatus = 'draft' | 'testing' | 'active' | 'degraded' | 'disabled';

export interface ProviderAccountSummary {
  id: string;
  legalName: string;
  displayName: string;
  status: ProviderAccountStatus;
  providerType: string;
  lastActivityAt: string | null;
  activeConnectionCount: number;
}

export interface ProviderTenantContext {
  providerAccountId: string;
  principalId: string;
  roleKey: 'owner' | 'integration_admin' | 'analyst' | 'support';
}
