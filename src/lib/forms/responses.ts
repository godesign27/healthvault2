import { supabase } from '../supabase';

// form_responses.patient_id references patient_profiles(id) — NOT the auth user id.
export interface FormResponseRow {
  id: string;
  template_id: string;
  patient_id: string;
  answers_json: Record<string, string> | null;
  status: string | null;
  signed_at: string | null;
}

export type FormResponseMap = Record<string, FormResponseRow>;

/** Resolve the current user's patient_profiles.id (every user has one — see backfill migration). */
export async function getPatientProfileId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('Failed to resolve patient profile:', error);
    return null;
  }
  return data?.id ?? null;
}

/** Load all of a patient's form responses, keyed by template_id. */
export async function loadFormResponses(patientProfileId: string): Promise<FormResponseMap> {
  const { data, error } = await supabase
    .from('form_responses')
    .select('id, template_id, patient_id, answers_json, status, signed_at')
    .eq('patient_id', patientProfileId);
  if (error) throw error;
  const map: FormResponseMap = {};
  (data || []).forEach((r) => {
    map[(r as FormResponseRow).template_id] = r as FormResponseRow;
  });
  return map;
}

/** Upsert a response (one per patient per template). Defaults to complete (Save in FormDrawer). */
export async function saveFormResponse(params: {
  patientProfileId: string;
  templateId: string;
  answers: Record<string, string>;
  markComplete?: boolean;
}): Promise<FormResponseRow> {
  const complete = params.markComplete !== false;
  const { data, error } = await supabase
    .from('form_responses')
    .upsert(
      {
        patient_id: params.patientProfileId,
        template_id: params.templateId,
        answers_json: params.answers,
        status: complete ? 'complete' : 'incomplete',
        signed_at: complete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id,template_id' },
    )
    .select('id, template_id, patient_id, answers_json, status, signed_at')
    .single();
  if (error) throw error;
  return data as FormResponseRow;
}

export function isResponseComplete(r?: FormResponseRow): boolean {
  if (!r) return false;
  return r.status === 'complete' || r.status === 'signed' || !!r.signed_at;
}
