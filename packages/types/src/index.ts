// Canonical data model for all Health Vault clients (web, desktop, mobile)

export type RecordKind =
  | "lab"
  | "imaging"
  | "pathology"
  | "specialist_report"
  | "other";

/** @deprecated Use RecordKind instead. Will be removed in a future version. */
export type RecordType = RecordKind;

export type RecordSource = "connected" | "shared" | "uploaded";

export type RecordStatus = "pending" | "fulfilled" | "declined";

export interface HealthRecord {
  id: string;
  title: string;
  providerName: string | null;
  serviceDate: string | null;   // ISO 8601 date
  kind: RecordKind;
  source: RecordSource;
  fileType: string | null;
  fileSizeBytes: number | null;
  previewUrl: string | null;
  tags: string[];
  aiSummary: string | null;
  fhirRef: Record<string, unknown> | null;
  createdAt: string;
}

export interface PendingRequest {
  id: string;
  providerName: string;
  providerEmail: string;
  doctorName: string | null;
  recordTypes: string[];
  status: "pending" | "sent" | "received" | "failed";
  createdAt: string;
  openedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
}

export interface EHRConnection {
  id: string;
  ehrSource: string;
  ehrPatientId: string | null;
  providerName: string;
  status: "active" | "pending" | "inactive";
  lastSyncedAt: string | null;
}

export interface VaultStats {
  totalRecords: number;
  connectedProviders: number;
  pendingRequests: number;
  lastSyncedAt: string | null;
}

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  dateOfBirth: string | null;
  phone: string | null;
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadedFile {
  recordId: string;
  title: string;
  kind: RecordKind;
  fileType: string;
  fileSizeBytes: number;
  previewUrl: string | null;
}
