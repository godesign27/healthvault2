import { HealthRecord, RecordKind, RecordSource, ShareLink, AIInsight } from './types';
import { UploadInput, ShareInput, InsightInput } from './zod';
import { mockRecords } from './mock';

let localRecords = [...mockRecords];

export async function listRecords(filters?: { kind?: RecordKind }): Promise<HealthRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  if (filters?.kind) {
    return localRecords.filter(r => r.kind === filters.kind);
  }

  return localRecords;
}

export async function getRecord(id: string): Promise<HealthRecord | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return localRecords.find(r => r.id === id) || null;
}

export async function uploadRecord(input: UploadInput): Promise<HealthRecord> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const newRecord: HealthRecord = {
    id: `rec-upload-${Date.now()}`,
    kind: input.kind ? RecordKind[input.kind as keyof typeof RecordKind] : RecordKind.Other,
    title: input.fileName,
    providerName: input.providerName,
    serviceDate: input.serviceDate,
    receivedAt: new Date().toISOString(),
    source: RecordSource.Uploaded,
    fileType: input.fileType,
    tags: ["uploaded"]
  };

  localRecords = [newRecord, ...localRecords];
  return newRecord;
}

export async function shareRecord(input: ShareInput): Promise<ShareLink> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

  return {
    id: `share-${Date.now()}`,
    recordId: input.recordId,
    recipientEmail: input.recipientEmail,
    message: input.message,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  };
}

export async function requestInsights(input: InsightInput): Promise<AIInsight> {
  await new Promise(resolve => setTimeout(resolve, 800));

  let result = "";

  switch (input.intent) {
    case "SUMMARIZE":
      if (input.recordIds && input.recordIds.length > 0) {
        const records = localRecords.filter(r => input.recordIds?.includes(r.id));
        result = records.map(r => `${r.title}: ${r.aiSummary || "No summary available"}`).join("\n\n");
      }
      break;

    case "COMPARE":
      if (input.recordIds && input.recordIds.length >= 2) {
        const records = localRecords.filter(r => input.recordIds?.includes(r.id));
        result = `Comparison of ${records.length} records:\n\n`;
        records.forEach((r, i) => {
          result += `Record ${i + 1} (${r.serviceDate}):\n${r.aiSummary}\n\n`;
        });
      }
      break;

    case "SEARCH":
    case "FIND_KIND":
      const filtered = localRecords.filter(r => {
        if (input.filters?.kind) {
          return r.kind === input.filters.kind;
        }
        return true;
      });
      result = `Found ${filtered.length} matching records`;
      break;

    case "FIND_DATE_RANGE":
      const dateFiltered = localRecords.filter(r => {
        if (!r.serviceDate) return false;
        if (input.filters?.from && r.serviceDate < input.filters.from) return false;
        if (input.filters?.to && r.serviceDate > input.filters.to) return false;
        return true;
      });
      result = `Found ${dateFiltered.length} records in date range`;
      break;

    default:
      result = "Analysis complete";
  }

  return {
    id: `insight-${Date.now()}`,
    recordIds: input.recordIds || [],
    intent: input.intent,
    result,
    createdAt: new Date().toISOString()
  };
}

export function resetMockData() {
  localRecords = [...mockRecords];
}
