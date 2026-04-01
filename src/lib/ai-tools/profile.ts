import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult, DEMO_USER_ID } from './types';

export const GetMedicalProfileInputZ = z.object({});

export type GetMedicalProfileInput = z.infer<typeof GetMedicalProfileInputZ>;

export interface MedicalProfileResult {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string | null;
    phone: string | null;
  } | null;
  counts: {
    conditions: number;
    medications: number;
    allergies: number;
    immunizations: number;
  };
  completionStatus: 'empty' | 'partial' | 'complete';
}

export async function getMedicalProfile(
  _input: GetMedicalProfileInput,
  userId: string
): Promise<ToolResult<MedicalProfileResult>> {
  try {
    const effectiveUserId = userId || DEMO_USER_ID;

    const [userRes, conditionsRes, medsRes, allergiesRes, immunizationsRes] =
      await Promise.all([
        supabase
          .from('user_profiles')
          .select('first_name, last_name, email, date_of_birth, phone')
          .eq('user_id', effectiveUserId)
          .maybeSingle(),
        supabase
          .from('conditions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', effectiveUserId),
        supabase
          .from('medications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', effectiveUserId),
        supabase
          .from('allergies')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', effectiveUserId),
        supabase
          .from('immunizations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', effectiveUserId),
      ]);

    const user = userRes.data
      ? {
          firstName: userRes.data.first_name,
          lastName: userRes.data.last_name,
          email: userRes.data.email,
          dateOfBirth: userRes.data.date_of_birth,
          phone: userRes.data.phone,
        }
      : null;

    const counts = {
      conditions: conditionsRes.count || 0,
      medications: medsRes.count || 0,
      allergies: allergiesRes.count || 0,
      immunizations: immunizationsRes.count || 0,
    };

    const totalItems = counts.conditions + counts.medications + counts.allergies + counts.immunizations;
    const hasProfile = !!user?.firstName;
    let completionStatus: 'empty' | 'partial' | 'complete';

    if (!hasProfile && totalItems === 0) {
      completionStatus = 'empty';
    } else if (hasProfile && totalItems >= 2) {
      completionStatus = 'complete';
    } else {
      completionStatus = 'partial';
    }

    return toolSuccess(
      { user, counts, completionStatus },
      `Medical profile: ${counts.conditions} conditions, ${counts.medications} medications, ${counts.allergies} allergies, ${counts.immunizations} immunizations. Status: ${completionStatus}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const UpdateMedicalProfileInputZ = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  confirmed: z.boolean(),
});

export type UpdateMedicalProfileInput = z.infer<typeof UpdateMedicalProfileInputZ>;

export interface UpdateMedicalProfileResult {
  updated: boolean;
  fields: string[];
}

export async function updateMedicalProfile(
  input: UpdateMedicalProfileInput,
  userId: string
): Promise<ToolResult<UpdateMedicalProfileResult>> {
  try {
    const parsed = UpdateMedicalProfileInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Profile update requires explicit confirmation. Please confirm to proceed.');
    }

    const effectiveUserId = userId || DEMO_USER_ID;

    const updates: Record<string, string> = {};
    const fieldNames: string[] = [];

    if (parsed.data.firstName !== undefined) {
      updates.first_name = parsed.data.firstName;
      fieldNames.push('first name');
    }
    if (parsed.data.lastName !== undefined) {
      updates.last_name = parsed.data.lastName;
      fieldNames.push('last name');
    }
    if (parsed.data.phone !== undefined) {
      updates.phone = parsed.data.phone;
      fieldNames.push('phone');
    }
    if (parsed.data.dateOfBirth !== undefined) {
      updates.date_of_birth = parsed.data.dateOfBirth;
      fieldNames.push('date of birth');
    }

    if (fieldNames.length === 0) {
      return toolError('No fields provided to update.');
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', effectiveUserId);

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    return toolSuccess(
      { updated: true, fields: fieldNames },
      `Updated ${fieldNames.join(', ')}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
