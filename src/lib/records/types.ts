export enum RecordSource {
  Connected = "CONNECTED",
  Uploaded = "UPLOADED",
  Shared = "SHARED"
}

export enum RecordKind {
  Lab = "LAB",
  Imaging = "IMAGING",
  Pathology = "PATHOLOGY",
  SpecialistReport = "SPECIALIST_REPORT",
  Other = "OTHER"
}

export type RecordId = string;

export interface HealthRecord {
  id: RecordId;
  kind: RecordKind;
  title: string;
  providerName?: string;
  providerId?: string;
  serviceDate?: string;      // ISO date
  receivedAt: string;        // ISO datetime
  source: RecordSource;
  fileType: "pdf" | "jpg" | "png" | "dicom" | "txt" | "unknown";
  fileSizeBytes?: number;
  previewUrl?: string;       // signed URL or local mock
  aiSummary?: string;        // optional short summary
  tags?: string[];
  fhirRef?: { system?: string; id?: string; resourceType?: string };
}

export interface ShareLink {
  id: string;
  recordId: RecordId;
  recipientEmail: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  recordIds: RecordId[];
  intent: "SUMMARIZE" | "COMPARE" | "SEARCH" | "EXPLAIN" | "FIND_KIND" | "FIND_DATE_RANGE";
  result: string;
  createdAt: string;
}
