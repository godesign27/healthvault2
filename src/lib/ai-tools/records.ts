import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult } from './types';

export const GetHealthRecordsInputZ = z.object({
  kind: z.enum(['lab', 'imaging', 'pathology', 'specialist_report', 'other']).optional(),
  source: z.enum(['connected', 'uploaded', 'shared']).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type GetHealthRecordsInput = z.infer<typeof GetHealthRecordsInputZ>;

export interface HealthRecordRow {
  id: string;
  kind: string;
  title: string;
  providerName: string | null;
  providerId: string | null;
  serviceDate: string | null;
  receivedAt: string;
  source: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  previewUrl: string | null;
  aiSummary: string | null;
  tags: string[];
  fhirRef: Record<string, unknown> | null;
}

export async function getHealthRecords(
  input: GetHealthRecordsInput,
  userId: string
): Promise<ToolResult<HealthRecordRow[]>> {
  try {
    const parsed = GetHealthRecordsInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { kind, source, fromDate, toDate, search, limit } = parsed.data;

    let query = supabase
      .from('health_records')
      .select('*')
      .eq('user_id', userId)
      .order('service_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (kind) {
      query = query.eq('kind', kind);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (fromDate) {
      query = query.gte('service_date', fromDate);
    }

    if (toDate) {
      query = query.lte('service_date', toDate);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,provider_name.ilike.%${search}%,ai_summary.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const records: HealthRecordRow[] = (data || []).map((row: any) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      providerName: row.provider_name,
      providerId: row.provider_id,
      serviceDate: row.service_date,
      receivedAt: row.received_at,
      source: row.source,
      fileType: row.file_type,
      fileSizeBytes: row.file_size_bytes,
      previewUrl: row.preview_url,
      aiSummary: row.ai_summary,
      tags: row.tags || [],
      fhirRef: row.fhir_ref,
    }));

    return toolSuccess(records, `Found ${records.length} health record${records.length !== 1 ? 's' : ''}.`);
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const SummarizeRecordInputZ = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
});

export type SummarizeRecordInput = z.infer<typeof SummarizeRecordInputZ>;

export interface RecordSummary {
  recordId: string;
  title: string;
  kind: string;
  providerName: string | null;
  serviceDate: string | null;
  existingSummary: string | null;
  generatedSummary: string;
}

export async function summarizeRecord(
  input: SummarizeRecordInput,
  userId: string
): Promise<ToolResult<RecordSummary>> {
  try {
    const parsed = SummarizeRecordInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { recordId } = parsed.data;

    const { data: record, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    if (!record) {
      return toolError('Record not found or you do not have access.');
    }

    if (record.ai_summary) {
      return toolSuccess(
        {
          recordId: record.id,
          title: record.title,
          kind: record.kind,
          providerName: record.provider_name,
          serviceDate: record.service_date,
          existingSummary: record.ai_summary,
          generatedSummary: record.ai_summary,
        },
        record.ai_summary
      );
    }

    const summary = buildLocalSummary(record);

    return toolSuccess(
      {
        recordId: record.id,
        title: record.title,
        kind: record.kind,
        providerName: record.provider_name,
        serviceDate: record.service_date,
        existingSummary: null,
        generatedSummary: summary,
      },
      summary
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function buildLocalSummary(record: any): string {
  const parts: string[] = [];

  parts.push(`${formatKind(record.kind)} record: "${record.title}"`);

  if (record.provider_name) {
    parts.push(`from ${record.provider_name}`);
  }

  if (record.service_date) {
    parts.push(`dated ${record.service_date}`);
  }

  parts.push(`received via ${record.source}`);

  if (record.tags?.length > 0) {
    parts.push(`tagged: ${record.tags.join(', ')}`);
  }

  return parts.join(' — ') + '.';
}

function formatKind(kind: string): string {
  const map: Record<string, string> = {
    lab: 'Lab',
    imaging: 'Imaging',
    pathology: 'Pathology',
    specialist_report: 'Specialist Report',
    other: 'Other',
  };
  return map[kind] || kind;
}

export const RequestHealthRecordInputZ = z.object({
  providerName: z.string().min(1, 'Provider name is required'),
  providerId: z.string().optional(),
  recordTypes: z.array(z.string()).default([]),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  notes: z.string().optional(),
  confirmed: z.boolean(),
});

export type RequestHealthRecordInput = z.infer<typeof RequestHealthRecordInputZ>;

export interface RecordRequestResult {
  requestId: string;
  providerName: string;
  status: string;
}

export async function requestHealthRecord(
  input: RequestHealthRecordInput,
  userId: string
): Promise<ToolResult<RecordRequestResult>> {
  try {
    const parsed = RequestHealthRecordInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Requesting health records requires confirmation. Please confirm to proceed.');
    }

    const { data, error } = await supabase
      .from('health_record_requests')
      .insert({
        user_id: userId,
        provider_name: parsed.data.providerName,
        provider_id: parsed.data.providerId || null,
        record_types: parsed.data.recordTypes,
        date_range_start: parsed.data.dateRangeStart || null,
        date_range_end: parsed.data.dateRangeEnd || null,
        notes: parsed.data.notes || null,
        status: 'pending',
      })
      .select('id, provider_name, status')
      .single();

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    return toolSuccess(
      {
        requestId: data.id,
        providerName: data.provider_name,
        status: data.status,
      },
      `Health record request submitted to ${data.provider_name}. Status: pending.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
