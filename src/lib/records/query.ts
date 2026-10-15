import { HealthVaultClient } from '../../../packages/api-client/src/client';
import { uploadRetryKey } from './upload-retry';
import { HealthRecord, RecordKind, RecordSource, ShareLink, AIInsight } from './types';
import { UploadInput, ShareInput, InsightInput } from './zod';
import { supabase } from '../supabase';


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
  if (ft === 'jpeg') return 'jpg';
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
      fileAccess: r.preview_url ? 'authenticated' as const : undefined,
      aiSummary: r.ai_summary || undefined,
      tags: r.tags || [],
    }));
  } catch {
    return [];
  }
}

export async function listRecords(filters?: { kind?: RecordKind }): Promise<HealthRecord[]> {
  const supabaseRecords = await fetchSupabaseRecords();

  const all = [...supabaseRecords];

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

  if (!data) return null;

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
    fileAccess: data.preview_url ? 'authenticated' : undefined,
    aiSummary: data.ai_summary || undefined,
    tags: data.tags || [],
  };
}

export async function uploadRecord(input: Omit<UploadInput, 'fileType'> & { file?: File; fileType?: UploadInput['fileType'] }): Promise<HealthRecord> {
  if (!input.file) throw new Error('Choose the actual file using Upload File in Health Records. A filename alone cannot be saved.');
  if (!input.file.size || input.file.size > 25 * 1024 * 1024) throw new Error('Choose a nonempty file of at most 25 MB.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user.id) throw new Error('Sign in before uploading a file.');
  const ownerId=session.user.id;
  const kind=(input.kind || 'OTHER').toLowerCase() as 'lab' | 'imaging' | 'pathology' | 'specialist_report' | 'other';
  const idempotencyKey=await uploadRetryKey(ownerId,await input.file.arrayBuffer(),
    [input.file.name,kind,input.providerName ?? null,input.serviceDate ?? null],localStorage);
  const client=new HealthVaultClient({supabaseUrl:import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey:import.meta.env.VITE_SUPABASE_ANON_KEY,getAccessToken:async()=>{
      const {data:{session:current}}=await supabase.auth.getSession();
      if(current?.user.id!==ownerId) throw new Error('The signed-in account changed. Select your file again.');
      return current.access_token;
    }});
  const receipt=await client.uploadRecord({file:input.file,fileName:input.file.name,kind,
    providerName:input.providerName,serviceDate:input.serviceDate,idempotencyKey});
  const record=await getRecord(receipt.recordId);
  if (!record) throw new Error('The upload was received, but the record could not be reloaded. Retry the same file to recover its saved status.');
  return record;
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

  const savedRecords = await listRecords();
  let result = "";

  switch (input.intent) {
    case "SUMMARIZE":
      if (input.recordIds && input.recordIds.length > 0) {
        const records = savedRecords.filter(r => input.recordIds?.includes(r.id));
        result = records.map(r => `${r.title}: ${r.aiSummary || "No summary available"}`).join("\n\n");
      }
      break;

    case "COMPARE":
      if (input.recordIds && input.recordIds.length >= 2) {
        const records = savedRecords.filter(r => input.recordIds?.includes(r.id));
        result = `Comparison of ${records.length} records:\n\n`;
        records.forEach((r, i) => {
          result += `Record ${i + 1} (${r.serviceDate}):\n${r.aiSummary}\n\n`;
        });
      }
      break;

    case "SEARCH":
    case "FIND_KIND":
      const filtered = savedRecords.filter(r => {
        if (input.filters?.kind) {
          return r.kind === input.filters.kind;
        }
        return true;
      });
      result = `Found ${filtered.length} matching records`;
      break;

    case "FIND_DATE_RANGE":
      const dateFiltered = savedRecords.filter(r => {
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
