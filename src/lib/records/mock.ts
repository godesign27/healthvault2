import { HealthRecord, RecordKind, RecordSource } from './types';

export const mockRecords: HealthRecord[] = [
  {
    id: "rec-1",
    kind: RecordKind.Lab,
    title: "Complete Metabolic Panel",
    providerName: "Quest Diagnostics",
    providerId: "quest-001",
    serviceDate: "2025-11-05",
    receivedAt: "2025-11-05T14:30:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 245600,
    aiSummary: "All values within normal range. Kidney and liver function normal.",
    tags: ["routine", "annual-checkup"]
  },
  {
    id: "rec-2",
    kind: RecordKind.Imaging,
    title: "Chest X-Ray",
    providerName: "City Medical Center",
    providerId: "cmc-001",
    serviceDate: "2025-10-28",
    receivedAt: "2025-10-28T16:45:00Z",
    source: RecordSource.Connected,
    fileType: "dicom",
    fileSizeBytes: 8920000,
    aiSummary: "No acute findings. Lungs clear bilaterally.",
    tags: ["imaging", "respiratory"]
  },
  {
    id: "rec-3",
    kind: RecordKind.Lab,
    title: "Lipid Panel",
    providerName: "LabCorp",
    providerId: "labcorp-001",
    serviceDate: "2025-10-15",
    receivedAt: "2025-10-15T10:20:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 189400,
    aiSummary: "Total cholesterol 185 mg/dL. LDL slightly elevated at 115 mg/dL.",
    tags: ["cardiovascular", "routine"]
  },
  {
    id: "rec-4",
    kind: RecordKind.SpecialistReport,
    title: "Cardiology Consultation",
    providerName: "Dr. Sarah Chen, MD",
    providerId: "card-003",
    serviceDate: "2025-09-22",
    receivedAt: "2025-09-22T11:00:00Z",
    source: RecordSource.Uploaded,
    fileType: "pdf",
    fileSizeBytes: 412300,
    aiSummary: "ECG normal. Blood pressure well-controlled. Continue current medications.",
    tags: ["cardiology", "follow-up"]
  },
  {
    id: "rec-5",
    kind: RecordKind.Pathology,
    title: "Skin Biopsy Report",
    providerName: "Memorial Pathology Lab",
    providerId: "path-001",
    serviceDate: "2025-09-10",
    receivedAt: "2025-09-11T09:15:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 156700,
    aiSummary: "Benign seborrheic keratosis. No evidence of malignancy.",
    tags: ["dermatology", "pathology"]
  },
  {
    id: "rec-6",
    kind: RecordKind.Lab,
    title: "Thyroid Function Panel",
    providerName: "Quest Diagnostics",
    providerId: "quest-001",
    serviceDate: "2025-08-30",
    receivedAt: "2025-08-30T13:45:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 198200,
    aiSummary: "TSH within normal limits. Thyroid function normal.",
    tags: ["endocrine", "routine"]
  },
  {
    id: "rec-7",
    kind: RecordKind.Imaging,
    title: "MRI Brain without Contrast",
    providerName: "Advanced Imaging Center",
    providerId: "aic-001",
    serviceDate: "2025-08-12",
    receivedAt: "2025-08-13T08:30:00Z",
    source: RecordSource.Shared,
    fileType: "dicom",
    fileSizeBytes: 45600000,
    aiSummary: "No acute intracranial abnormality. Age-appropriate findings.",
    tags: ["neurology", "imaging"]
  },
  {
    id: "rec-8",
    kind: RecordKind.Lab,
    title: "Hemoglobin A1C",
    providerName: "LabCorp",
    providerId: "labcorp-001",
    serviceDate: "2025-07-20",
    receivedAt: "2025-07-20T14:10:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 134500,
    aiSummary: "A1C at 5.4%, indicating good glucose control.",
    tags: ["diabetes", "monitoring"]
  },
  {
    id: "rec-9",
    kind: RecordKind.SpecialistReport,
    title: "Ophthalmology Exam",
    providerName: "Vision Care Associates",
    providerId: "oph-002",
    serviceDate: "2025-06-15",
    receivedAt: "2025-06-15T10:45:00Z",
    source: RecordSource.Uploaded,
    fileType: "pdf",
    fileSizeBytes: 289100,
    aiSummary: "Vision 20/20 both eyes. No retinopathy detected.",
    tags: ["ophthalmology", "annual"]
  },
  {
    id: "rec-10",
    kind: RecordKind.Imaging,
    title: "Abdominal Ultrasound",
    providerName: "City Medical Center",
    providerId: "cmc-001",
    serviceDate: "2025-05-28",
    receivedAt: "2025-05-28T15:20:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 567800,
    aiSummary: "Liver, gallbladder, and kidneys appear normal. No masses or stones.",
    tags: ["gastroenterology", "imaging"]
  },
  {
    id: "rec-11",
    kind: RecordKind.Lab,
    title: "Vitamin D Level",
    providerName: "Quest Diagnostics",
    providerId: "quest-001",
    serviceDate: "2025-04-10",
    receivedAt: "2025-04-10T11:30:00Z",
    source: RecordSource.Connected,
    fileType: "pdf",
    fileSizeBytes: 123400,
    aiSummary: "Vitamin D at 32 ng/mL. Within normal range.",
    tags: ["vitamins", "wellness"]
  },
  {
    id: "rec-12",
    kind: RecordKind.Other,
    title: "Physical Therapy Progress Note",
    providerName: "Rehab Plus",
    providerId: "pt-001",
    serviceDate: "2025-03-25",
    receivedAt: "2025-03-25T16:00:00Z",
    source: RecordSource.Uploaded,
    fileType: "pdf",
    fileSizeBytes: 201500,
    aiSummary: "Good progress with shoulder mobility exercises. Continue current plan.",
    tags: ["physical-therapy", "orthopedic"]
  }
];

export function getMockRecords(kind?: RecordKind): HealthRecord[] {
  if (!kind) return mockRecords;
  return mockRecords.filter(r => r.kind === kind);
}

export function getMockRecordById(id: string): HealthRecord | undefined {
  return mockRecords.find(r => r.id === id);
}
