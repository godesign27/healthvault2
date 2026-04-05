import { HealthRecord, RecordKind, RecordSource, ShareLink, AIInsight } from './types';
import { UploadInput, ShareInput, InsightInput } from './zod';
import { mockRecords } from './mock';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

let localRecords = [...mockRecords];

function mapKind(kind: string): RecordKind {
  const map: Record<string, RecordKind> = {
    lab: RecordKind.Lab,
    imaging: RecordKind.Imaging,
    pathology: RecordKind.Pathology,
    specialist_report: RecordKind.SpecialistReport,
    other: RecordKind.Other,
  };
  return map[kind?.toLowerCase()] || RecordKind.Other;
}

function mapFileType(ft: string | null): HealthRecord['fileType'] {
  const valid = ['pdf', 'jpg', 'png', 'dicom', 'txt'] as const;
  if (ft && valid.includes(ft as any)) return ft as HealthRecord['fileType'];
  return 'pdf';
}

async function fetchSupabaseRecords(): Promise<HealthRecord[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/health_records?user_id=eq.${DEMO_USER_ID}&order=received_at.desc&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    return rows.map((r) => ({
      id: r.id,
      kind: mapKind(r.kind),
      title: r.title,
      providerName: r.provider_name || undefined,
      providerId: r.provider_id || undefined,
      serviceDate: r.service_date || undefined,
      receivedAt: r.received_at || r.created_at,
      source: r.source === 'shared' ? RecordSource.Shared : r.source === 'connected' ? RecordSource.Connected : RecordSource.Uploaded,
      fileType: mapFileType(r.file_type),
      fileSizeBytes: r.file_size_bytes || undefined,
      previewUrl: r.preview_url || undefined,
      aiSummary: r.ai_summary || undefined,
      tags: r.tags || [],
    }));
  } catch {
    return [];
  }
}

export async function listRecords(filters?: { kind?: RecordKind }): Promise<HealthRecord[]> {
  const supabaseRecords = await fetchSupabaseRecords();

  const supabaseIds = new Set(supabaseRecords.map(r => r.id));
  const merged = [
    ...supabaseRecords,
    ...localRecords.filter(r => !supabaseIds.has(r.id)),
  ];

  merged.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  if (filters?.kind) {
    return merged.filter(r => r.kind === filters.kind);
  }

  return merged;
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
