import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult, DEMO_USER_ID } from './types';

export const GetMedicationsInputZ = z.object({
  activeOnly: z.boolean().default(false),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type GetMedicationsInput = z.infer<typeof GetMedicationsInputZ>;

export interface MedicationResult {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prescribedBy: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export async function getMedications(
  input: GetMedicationsInput,
  userId: string
): Promise<ToolResult<MedicationResult[]>> {
  try {
    const parsed = GetMedicationsInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { activeOnly, search, limit } = parsed.data;
    const effectiveUserId = userId || DEMO_USER_ID;

    let query = supabase
      .from('medications')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('start_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (activeOnly) {
      query = query.or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0]);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,prescribed_by.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const meds: MedicationResult[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      prescribedBy: row.prescribed_by,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: !row.end_date || row.end_date >= today,
      notes: row.notes,
    }));

    const activeCount = meds.filter((m) => m.isActive).length;
    return toolSuccess(
      meds,
      `Found ${meds.length} medication${meds.length !== 1 ? 's' : ''} (${activeCount} active).`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const SummarizeMedicationInputZ = z.object({
  medicationId: z.string().min(1, 'Medication ID is required'),
});

export type SummarizeMedicationInput = z.infer<typeof SummarizeMedicationInputZ>;

export interface MedicationSummary {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prescribedBy: string | null;
  isActive: boolean;
  duration: string;
  summary: string;
}

export async function summarizeMedication(
  input: SummarizeMedicationInput,
  userId: string
): Promise<ToolResult<MedicationSummary>> {
  try {
    const parsed = SummarizeMedicationInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const effectiveUserId = userId || DEMO_USER_ID;

    const { data: med, error } = await supabase
      .from('medications')
      .select('*')
      .eq('id', parsed.data.medicationId)
      .eq('user_id', effectiveUserId)
      .maybeSingle();

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    if (!med) {
      return toolError('Medication not found or you do not have access.');
    }

    const today = new Date().toISOString().split('T')[0];
    const isActive = !med.end_date || med.end_date >= today;
    const duration = buildDurationLabel(med.start_date, med.end_date);

    const parts: string[] = [];
    parts.push(`${med.name}${med.dosage ? ` (${med.dosage})` : ''}`);
    if (med.frequency) parts.push(`taken ${med.frequency}`);
    if (med.prescribed_by) parts.push(`prescribed by ${med.prescribed_by}`);
    parts.push(isActive ? 'currently active' : 'no longer active');
    if (duration) parts.push(duration);

    const summary = parts.join(' -- ') + '.';

    return toolSuccess(
      {
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        prescribedBy: med.prescribed_by,
        isActive,
        duration,
        summary,
      },
      summary
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const CheckRefillStatusInputZ = z.object({
  medicationId: z.string().min(1).optional(),
});

export type CheckRefillStatusInput = z.infer<typeof CheckRefillStatusInputZ>;

export interface RefillStatusResult {
  medications: Array<{
    id: string;
    name: string;
    isActive: boolean;
    endDate: string | null;
    daysRemaining: number | null;
    needsRefill: boolean;
  }>;
}

export async function checkRefillStatus(
  input: CheckRefillStatusInput,
  userId: string
): Promise<ToolResult<RefillStatusResult>> {
  try {
    const parsed = CheckRefillStatusInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const effectiveUserId = userId || DEMO_USER_ID;

    let query = supabase
      .from('medications')
      .select('id, name, end_date, start_date')
      .eq('user_id', effectiveUserId);

    if (parsed.data.medicationId) {
      query = query.eq('id', parsed.data.medicationId);
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const medications = (data || []).map((med: any) => {
      const endDate = med.end_date ? new Date(med.end_date) : null;
      const isActive = !endDate || endDate >= today;
      const daysRemaining = endDate
        ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const needsRefill = isActive && daysRemaining !== null && daysRemaining <= 30;

      return {
        id: med.id,
        name: med.name,
        isActive,
        endDate: med.end_date,
        daysRemaining,
        needsRefill,
      };
    });

    const needingRefill = medications.filter((m) => m.needsRefill);

    return toolSuccess(
      { medications },
      needingRefill.length > 0
        ? `${needingRefill.length} medication${needingRefill.length !== 1 ? 's' : ''} may need a refill soon.`
        : 'No medications need a refill at this time.'
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function buildDurationLabel(startDate: string | null, endDate: string | null): string {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.round(months / 12);
  return `${years} year${years !== 1 ? 's' : ''}`;
}
