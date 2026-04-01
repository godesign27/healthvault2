import { HealthRecord, RecordKind, RecordSource } from './types';

export function mapFhirDiagnosticReport(resource: any): HealthRecord[] {
  const records: HealthRecord[] = [];

  const record: HealthRecord = {
    id: `fhir-dr-${resource.id}`,
    kind: RecordKind.Lab,
    title: resource.code?.text || "Diagnostic Report",
    providerName: resource.performer?.[0]?.display,
    serviceDate: resource.effectiveDateTime?.split('T')[0],
    receivedAt: resource.issued || new Date().toISOString(),
    source: RecordSource.Connected,
    fileType: "pdf",
    fhirRef: {
      system: resource.meta?.source,
      id: resource.id,
      resourceType: "DiagnosticReport"
    }
  };

  records.push(record);
  return records;
}

export function mapFhirImagingStudy(resource: any): HealthRecord[] {
  const records: HealthRecord[] = [];

  const record: HealthRecord = {
    id: `fhir-is-${resource.id}`,
    kind: RecordKind.Imaging,
    title: resource.description || resource.procedureCode?.[0]?.text || "Imaging Study",
    providerName: resource.referrer?.display,
    serviceDate: resource.started?.split('T')[0],
    receivedAt: resource.started || new Date().toISOString(),
    source: RecordSource.Connected,
    fileType: "dicom",
    fhirRef: {
      system: resource.meta?.source,
      id: resource.id,
      resourceType: "ImagingStudy"
    }
  };

  records.push(record);
  return records;
}

export function mapFhirDocumentReference(resource: any): HealthRecord[] {
  const records: HealthRecord[] = [];

  let kind = RecordKind.Other;
  const category = resource.category?.[0]?.coding?.[0]?.code;
  if (category === 'laboratory') kind = RecordKind.Lab;
  if (category === 'imaging') kind = RecordKind.Imaging;
  if (category === 'pathology') kind = RecordKind.Pathology;

  const record: HealthRecord = {
    id: `fhir-doc-${resource.id}`,
    kind,
    title: resource.description || resource.type?.text || "Medical Document",
    providerName: resource.author?.[0]?.display,
    serviceDate: resource.date?.split('T')[0],
    receivedAt: resource.date || new Date().toISOString(),
    source: RecordSource.Connected,
    fileType: resource.content?.[0]?.attachment?.contentType === "application/pdf" ? "pdf" : "unknown",
    fileSizeBytes: resource.content?.[0]?.attachment?.size,
    previewUrl: resource.content?.[0]?.attachment?.url,
    fhirRef: {
      system: resource.meta?.source,
      id: resource.id,
      resourceType: "DocumentReference"
    }
  };

  records.push(record);
  return records;
}
