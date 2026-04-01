export type ProviderContext = "medical" | "insurance" | "onboarding";

export interface ProviderConnection {
  id: string;
  name: string;
  fhirBaseUrl: string;
  patientId: string;
  scopes: string[];
  lastSyncedAt?: string;
  context: ProviderContext;
  userId: string;
  createdAt: string;
}
