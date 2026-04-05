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

export const GetHealthRecordRequestsInputZ = z.object({
  requestId: z.string().optional(),
  status: z.enum(['pending', 'sent', 'received', 'failed']).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type GetHealthRecordRequestsInput = z.infer<typeof GetHealthRecordRequestsInputZ>;

export interface HealthRecordRequestRow {
  id: string;
  providerName: string;
  providerId: string | null;
  providerEmail: string | null;
  doctorName: string | null;
  patientName: string | null;
  recordTypes: string[];
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  status: string;
  notes: string | null;
  messagePreview: string | null;
  urgency: string | null;
  createdAt: string;
  updatedAt: string;
  openedAt: string | null;
  submittedAt: string | null;
  expiresAt: string | null;
}

export async function getHealthRecordRequests(
  input: GetHealthRecordRequestsInput,
  userId: string
): Promise<ToolResult<HealthRecordRequestRow[]>> {
  try {
    const parsed = GetHealthRecordRequestsInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { requestId, status, limit } = parsed.data;

    let query = supabase
      .from('health_record_requests')
      .select(
        'id, provider_name, provider_id, provider_email, doctor_name, patient_name, record_types, date_range_start, date_range_end, status, notes, message, urgency, created_at, updated_at, opened_at, submitted_at, expires_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (requestId) {
      query = query.eq('id', requestId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const rows: HealthRecordRequestRow[] = (data || []).map((r: any) => ({
      id: r.id,
      providerName: r.provider_name,
      providerId: r.provider_id,
      providerEmail: r.provider_email,
      doctorName: r.doctor_name,
      patientName: r.patient_name,
      recordTypes: r.record_types || [],
      dateRangeStart: r.date_range_start,
      dateRangeEnd: r.date_range_end,
      status: r.status,
      notes: r.notes,
      messagePreview: r.message ? String(r.message).slice(0, 200) : null,
      urgency: r.urgency,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      openedAt: r.opened_at,
      submittedAt: r.submitted_at,
      expiresAt: r.expires_at,
    }));

    return toolSuccess(
      rows,
      `Found ${rows.length} record request${rows.length !== 1 ? 's' : ''}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const DeleteHealthRecordRequestInputZ = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  confirmed: z.boolean(),
});

export type DeleteHealthRecordRequestInput = z.infer<typeof DeleteHealthRecordRequestInputZ>;

export async function deleteHealthRecordRequest(
  input: DeleteHealthRecordRequestInput,
  userId: string
): Promise<ToolResult<{ requestId: string; deleted: boolean }>> {
  try {
    const parsed = DeleteHealthRecordRequestInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Deleting a record request requires confirmation.');
    }

    const { error } = await supabase
      .from('health_record_requests')
      .delete()
      .eq('id', parsed.data.requestId)
      .eq('user_id', userId);

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    return toolSuccess(
      { requestId: parsed.data.requestId, deleted: true },
      'Record request removed.'
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const RequestHealthRecordInputZ = z.object({
  providerName: z.string().min(1, 'Provider name is required'),
  providerEmail: z.string().email('Valid provider email is required'),
  providerId: z.string().optional(),
  doctorName: z.string().optional(),
  patientName: z.string().optional(),
  recordTypes: z.array(z.string()).default(['OTHER']),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  confirmed: z.boolean(),
});

export type RequestHealthRecordInput = z.infer<typeof RequestHealthRecordInputZ>;

export interface RecordRequestResult {
  requestId: string;
  providerName: string;
  status: string;
  emailSent?: boolean;
  emailError?: string | null;
  expiresAt?: string | null;
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

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const res = await fetch(`${supabaseUrl}/functions/v1/record-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        providerName: parsed.data.providerName,
        providerEmail: parsed.data.providerEmail,
        providerId: parsed.data.providerId,
        doctorName: parsed.data.doctorName,
        patientName: parsed.data.patientName,
        recordTypes: parsed.data.recordTypes,
        dateRangeStart: parsed.data.dateRangeStart,
        dateRangeEnd: parsed.data.dateRangeEnd,
        message: parsed.data.message,
        notes: parsed.data.notes,
        urgency: parsed.data.urgency,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return toolError(
        typeof body.error === 'string' ? body.error : `Record request failed (${res.status})`
      );
    }

    return toolSuccess(
      {
        requestId: body.id,
        providerName: parsed.data.providerName,
        status: body.status,
        emailSent: body.emailSent,
        emailError: body.emailError ?? null,
        expiresAt: body.expiresAt ?? null,
      },
      body.emailSent
        ? `Record request sent to ${parsed.data.providerName}; the provider received an email with a secure upload link.`
        : `Record request created for ${parsed.data.providerName}.${body.emailError ? ` ${body.emailError}` : ''}`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
