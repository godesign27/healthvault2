export type ProviderConnectionStrategy =
  | "existing_connection"
  | "direct_provider_connection"
  | "epic_connection"
  | "manual_fallback";

export interface ProviderOrganizationSummary {
  id: string;
  name: string;
  ehrVendor: string | null;
  portalBrand: string | null;
  fhirEndpointUrl: string | null;
  supportsDirectConnection: boolean;
  supportsEpicConnection: boolean;
  supportsManualRequest: boolean;
}

export interface ProviderConnectionSummary {
  id: string;
  userId: string;
  providerOrganizationId: string;
  providerOrganizationName: string;
  connectionMethod: ProviderConnectionStrategy;
  status: "active" | "expired" | "revoked" | "pending";
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface ProviderRecordConnectionResolution {
  success: boolean;
  data?: {
    strategy: ProviderConnectionStrategy;
    providerOrganization: ProviderOrganizationSummary | null;
    existingConnection: ProviderConnectionSummary | null;
    reason: string;
    nextAction: string;
  };
  error?: string;
}

export interface RecordImportPreviewItem {
  resourceType: "condition" | "medication" | "allergy" | "immunization";
  name: string;
  date: string | null;
  source: string | null;
  status: string | null;
  isDuplicate: boolean;
}

export interface RecordImportJobSummary {
  importJobId: string;
  userId: string;
  providerConnectionId: string | null;
  strategy: ProviderConnectionStrategy;
  status: "preview" | "confirmed" | "importing" | "complete" | "failed";
  counts: {
    conditions: number;
    medications: number;
    allergies: number;
    immunizations: number;
    total: number;
    duplicates: number;
  };
  createdAt: string;
  completedAt: string | null;
}
