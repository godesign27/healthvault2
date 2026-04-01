export type ProviderConnectionSource = "FHIR" | "Manual" | "Referral";
export type ProviderRelationship = "Primary" | "Specialist" | "Dental" | "Vision" | "Therapy" | "Other";
export type DeliveryOption = "Pickup" | "Delivery" | "Mail";

export interface Provider {
  id: string;
  userId: string;
  npi?: string;
  name: string;
  specialty?: string;
  clinic?: string;
  phone?: string;
  email?: string;
  address?: string;
  relationship?: ProviderRelationship;
  connectionSource: ProviderConnectionSource;
  lastVisitDate?: string;
  inNetwork?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pharmacy {
  id: string;
  userId: string;
  name: string;
  chain?: string;
  phone?: string;
  address?: string;
  preferred?: boolean;
  deliveryOptions?: DeliveryOption[];
  inNetwork?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsuranceContext {
  connected: boolean;
  name?: string;
  planId?: string;
}
