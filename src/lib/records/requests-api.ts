import { supabase } from '../supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('user_id', session.user.id)
    .maybeSingle();

  const patientName = input.patientName ||
    (profile ? `${profile.first_name} ${profile.last_name}`.trim() : '') ||
    session.user.email || '';

  const res = await fetch(`${SUPABASE_URL}/functions/v1/record-request`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: session.user.id,
      providerName: input.providerName,
      providerEmail: input.providerEmail,
      doctorName: input.doctorName,
      recordTypes: input.recordTypes,
      message: input.message,
      patientName,
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

export interface ResendRequestResult {
  id: string;
  status: string;
  emailSent: boolean;
  emailError: string | null;
}

export async function resendRecordRequest(requestId: string): Promise<ResendRequestResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/record-request/${requestId}/resend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to resend request');
  }

  return res.json();
}

export async function fetchRecordRequests(): Promise<RecordRequestRow[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from('health_record_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
  return (data || []) as RecordRequestRow[];
}
