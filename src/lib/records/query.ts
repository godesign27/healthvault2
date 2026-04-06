import { HealthRecord, RecordKind, RecordSource, ShareLink, AIInsight } from './types';
import { UploadInput, ShareInput, InsightInput } from './zod';
import { supabase } from '../supabase';

let localUploads: HealthRecord[] = [];

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
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return [];

    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', session.user.id)
      .order('received_at', { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
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
  const all = [
    ...supabaseRecords,
    ...localUploads.filter(r => !supabaseIds.has(r.id)),
  ];

  all.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  if (filters?.kind) {
    return all.filter(r => r.kind === filters.kind);
  }

  return all;
}

export async function getRecord(id: string): Promise<HealthRecord | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const { data } = await supabase
    .from('health_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!data) return localUploads.find(r => r.id === id) || null;

  return {
    id: data.id,
    kind: mapKind(data.kind),
    title: data.title,
    providerName: data.provider_name || undefined,
    providerId: data.provider_id || undefined,
    serviceDate: data.service_date || undefined,
    receivedAt: data.received_at || data.created_at,
    source: data.source === 'shared' ? RecordSource.Shared : data.source === 'connected' ? RecordSource.Connected : RecordSource.Uploaded,
    fileType: mapFileType(data.file_type),
    fileSizeBytes: data.file_size_bytes || undefined,
    previewUrl: data.preview_url || undefined,
    aiSummary: data.ai_summary || undefined,
    tags: data.tags || [],
  };
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

  localUploads = [newRecord, ...localUploads];
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
        const records = localUploads.filter(r => input.recordIds?.includes(r.id));
        result = records.map(r => `${r.title}: ${r.aiSummary || "No summary available"}`).join("\n\n");
      }
      break;

    case "COMPARE":
      if (input.recordIds && input.recordIds.length >= 2) {
        const records = localUploads.filter(r => input.recordIds?.includes(r.id));
        result = `Comparison of ${records.length} records:\n\n`;
        records.forEach((r, i) => {
          result += `Record ${i + 1} (${r.serviceDate}):\n${r.aiSummary}\n\n`;
        });
      }
      break;

    case "SEARCH":
    case "FIND_KIND":
      const filtered = localUploads.filter(r => {
        if (input.filters?.kind) {
          return r.kind === input.filters.kind;
        }
        return true;
      });
      result = `Found ${filtered.length} matching records`;
      break;

    case "FIND_DATE_RANGE":
      const dateFiltered = localUploads.filter(r => {
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

export function resetLocalUploads() {
  localUploads = [];
}
