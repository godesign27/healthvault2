import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult, DEMO_USER_ID } from './types';

export const GetMedicalHistoryInputZ = z.object({
  section: z
    .enum(['conditions', 'medications', 'allergies', 'immunizations', 'all'])
    .optional()
    .default('all'),
});

export type GetMedicalHistoryInput = z.infer<typeof GetMedicalHistoryInputZ>;

export interface MedicalHistoryResult {
  conditions?: Array<{ id: string; name: string; status: string; onsetDate: string | null }>;
  medications?: Array<{ id: string; name: string; dosage: string | null; frequency: string | null; isActive: boolean }>;
  allergies?: Array<{ id: string; allergen: string; severity: string | null; reaction: string | null }>;
  immunizations?: Array<{ id: string; name: string; dateAdministered: string | null; nextDose: string | null }>;
}

export async function getMedicalHistory(
  input: GetMedicalHistoryInput,
  userId: string
): Promise<ToolResult<MedicalHistoryResult>> {
  try {
    const parsed = GetMedicalHistoryInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { section } = parsed.data;
    const effectiveUserId = userId || DEMO_USER_ID;
    const result: MedicalHistoryResult = {};

    const fetchConditions = section === 'all' || section === 'conditions';
    const fetchMedications = section === 'all' || section === 'medications';
    const fetchAllergies = section === 'all' || section === 'allergies';
    const fetchImmunizations = section === 'all' || section === 'immunizations';

    const queries = [];

    if (fetchConditions) {
      queries.push(
        supabase
          .from('conditions')
          .select('id, name, status, onset_date')
          .eq('user_id', effectiveUserId)
          .order('name', { ascending: true })
      );
    }

    if (fetchMedications) {
      queries.push(
        supabase
          .from('medications')
          .select('id, name, dosage, frequency, end_date')
          .eq('user_id', effectiveUserId)
          .order('name', { ascending: true })
      );
    }

    if (fetchAllergies) {
      queries.push(
        supabase
          .from('allergies')
          .select('id, allergen, severity, reaction')
          .eq('user_id', effectiveUserId)
          .order('allergen', { ascending: true })
      );
    }

    if (fetchImmunizations) {
      queries.push(
        supabase
          .from('immunizations')
          .select('id, name, date_administered, next_dose')
          .eq('user_id', effectiveUserId)
          .order('name', { ascending: true })
      );
    }

    const results = await Promise.all(queries);
    let idx = 0;

    if (fetchConditions) {
      const { data, error } = results[idx++];
      if (!error && data) {
        result.conditions = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          onsetDate: r.onset_date,
        }));
      }
    }

    if (fetchMedications) {
      const { data, error } = results[idx++];
      const today = new Date().toISOString().split('T')[0];
      if (!error && data) {
        result.medications = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          dosage: r.dosage,
          frequency: r.frequency,
          isActive: !r.end_date || r.end_date >= today,
        }));
      }
    }

    if (fetchAllergies) {
      const { data, error } = results[idx++];
      if (!error && data) {
        result.allergies = data.map((r: any) => ({
          id: r.id,
          allergen: r.allergen,
          severity: r.severity,
          reaction: r.reaction,
        }));
      }
    }

    if (fetchImmunizations) {
      const { data, error } = results[idx++];
      if (!error && data) {
        result.immunizations = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          dateAdministered: r.date_administered,
          nextDose: r.next_dose,
        }));
      }
    }

    const counts: string[] = [];
    if (result.conditions) counts.push(`${result.conditions.length} conditions`);
    if (result.medications) counts.push(`${result.medications.length} medications`);
    if (result.allergies) counts.push(`${result.allergies.length} allergies`);
    if (result.immunizations) counts.push(`${result.immunizations.length} immunizations`);

    return toolSuccess(result, `Medical history: ${counts.join(', ')}.`);
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
