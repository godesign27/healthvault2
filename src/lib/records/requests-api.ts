import { supabase } from '../supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface RecordRequestInput {
  providerName: string;
  providerEmail: string;
  doctorName?: string;
  recordTypes: string[];
  message?: string;
  patientName?: string;
  urgency?: string;
  notes?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export interface RecordRequestRow {
  id: string;
  provider_name: string;
  provider_email: string;
  doctor_name: string | null;
  record_types: string[];
  message: string | null;
  patient_name: string;
  status: string;
  urgency: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  opened_at: string | null;
  expires_at: string | null;
}

export interface CreateRequestResult {
  id: string;
  status: string;
  emailSent: boolean;
  emailError: string | null;
}

export async function createRecordRequest(
  input: RecordRequestInput
): Promise<CreateRequestResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/record-request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: DEMO_USER_ID,
      providerName: input.providerName,
      providerEmail: input.providerEmail,
      doctorName: input.doctorName,
      recordTypes: input.recordTypes,
      message: input.message,
      patientName: input.patientName || 'Timothy McGuire',
      urgency: input.urgency || 'routine',
      notes: input.notes,
      dateRangeStart: input.dateRangeStart,
      dateRangeEnd: input.dateRangeEnd,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create record request');
  }

  return res.json();
}

export async function fetchRecordRequests(): Promise<RecordRequestRow[]> {
  const { data, error } = await supabase
    .from('health_record_requests')
    .select('*')
    .eq('user_id', DEMO_USER_ID)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
