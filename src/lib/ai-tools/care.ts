import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult, DEMO_USER_ID } from './types';

export const GetCareTeamInputZ = z.object({
  primaryOnly: z.boolean().default(false),
  search: z.string().optional(),
});

export type GetCareTeamInput = z.infer<typeof GetCareTeamInputZ>;

export interface CareTeamMember {
  id: string;
  name: string;
  title: string | null;
  specialty: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
}

export async function getCareTeam(
  input: GetCareTeamInput,
  userId: string
): Promise<ToolResult<CareTeamMember[]>> {
  try {
    const parsed = GetCareTeamInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const effectiveUserId = userId || DEMO_USER_ID;
    let query = supabase
      .from('care_team')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });

    if (parsed.data.primaryOnly) {
      query = query.eq('is_primary', true);
    }

    if (parsed.data.search) {
      query = query.or(
        `name.ilike.%${parsed.data.search}%,specialty.ilike.%${parsed.data.search}%,organization.ilike.%${parsed.data.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const members: CareTeamMember[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      specialty: row.specialty,
      organization: row.organization,
      email: row.email,
      phone: row.phone,
      isPrimary: row.is_primary,
      notes: row.notes,
    }));

    return toolSuccess(
      members,
      `Found ${members.length} care team member${members.length !== 1 ? 's' : ''}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const GetCareTimelineInputZ = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

export type GetCareTimelineInput = z.infer<typeof GetCareTimelineInputZ>;

export interface CareTimelineEvent {
  type: 'record' | 'form' | 'share';
  id: string;
  title: string;
  date: string;
  detail: string | null;
}

export async function getCareTimeline(
  input: GetCareTimelineInput,
  userId: string
): Promise<ToolResult<CareTimelineEvent[]>> {
  try {
    const parsed = GetCareTimelineInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const effectiveUserId = userId || DEMO_USER_ID;
    const { limit } = parsed.data;

    const [recordsRes, formsRes, sharesRes] = await Promise.all([
      supabase
        .from('health_records')
        .select('id, title, service_date, kind, provider_name')
        .eq('user_id', effectiveUserId)
        .order('service_date', { ascending: false, nullsFirst: false })
        .limit(limit),
      supabase
        .from('form_responses')
        .select('id, status, updated_at, form_templates!inner(title)')
        .eq('patient_id', effectiveUserId)
        .order('updated_at', { ascending: false })
        .limit(limit),
      supabase
        .from('share_events')
        .select('id, sent_at, status, recipient')
        .eq('patient_id', effectiveUserId)
        .order('sent_at', { ascending: false })
        .limit(limit),
    ]);

    const events: CareTimelineEvent[] = [];

    if (!recordsRes.error && recordsRes.data) {
      for (const r of recordsRes.data) {
        events.push({
          type: 'record',
          id: r.id,
          title: r.title,
          date: r.service_date || '',
          detail: r.provider_name ? `From ${r.provider_name}` : null,
        });
      }
    }

    if (!formsRes.error && formsRes.data) {
      for (const f of formsRes.data as any[]) {
        events.push({
          type: 'form',
          id: f.id,
          title: f.form_templates?.title || 'Medical Form',
          date: f.updated_at || '',
          detail: f.status === 'complete' ? 'Completed' : 'In progress',
        });
      }
    }

    if (!sharesRes.error && sharesRes.data) {
      for (const s of sharesRes.data as any[]) {
        const recipientName =
          typeof s.recipient === 'object' ? s.recipient?.name || 'Someone' : 'Someone';
        events.push({
          type: 'share',
          id: s.id,
          title: `Shared records with ${recipientName}`,
          date: s.sent_at || '',
          detail: s.status,
        });
      }
    }

    events.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const trimmed = events.slice(0, limit);

    return toolSuccess(
      trimmed,
      `Retrieved ${trimmed.length} care timeline event${trimmed.length !== 1 ? 's' : ''}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const GetCareOverviewInputZ = z.object({});

export type GetCareOverviewInput = z.infer<typeof GetCareOverviewInputZ>;

export interface CareOverviewResult {
  careTeamCount: number;
  activeMedications: number;
  pendingForms: number;
  recentRecords: number;
  activeConditions: number;
  allergies: number;
  upcomingImmunizations: number;
}

export async function getCareOverview(
  _input: GetCareOverviewInput,
  userId: string
): Promise<ToolResult<CareOverviewResult>> {
  try {
    const effectiveUserId = userId || DEMO_USER_ID;
    const today = new Date().toISOString().split('T')[0];

    const [
      careTeamRes,
      medsRes,
      formsRes,
      recordsRes,
      conditionsRes,
      allergiesRes,
      immunizationsRes,
    ] = await Promise.all([
      supabase.from('care_team').select('id', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
      supabase.from('medications').select('id, end_date').eq('user_id', effectiveUserId),
      supabase.from('form_responses').select('id', { count: 'exact', head: true }).eq('patient_id', effectiveUserId).eq('status', 'incomplete'),
      supabase.from('health_records').select('id', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
      supabase.from('conditions').select('id', { count: 'exact', head: true }).eq('user_id', effectiveUserId).eq('status', 'Active'),
      supabase.from('allergies').select('id', { count: 'exact', head: true }).eq('user_id', effectiveUserId),
      supabase.from('immunizations').select('id, next_dose').eq('user_id', effectiveUserId),
    ]);

    const activeMeds = (medsRes.data || []).filter(
      (m: any) => !m.end_date || m.end_date >= today
    ).length;

    const upcomingImmunizations = (immunizationsRes.data || []).filter(
      (i: any) => i.next_dose && i.next_dose >= today
    ).length;

    const overview: CareOverviewResult = {
      careTeamCount: careTeamRes.count || 0,
      activeMedications: activeMeds,
      pendingForms: formsRes.count || 0,
      recentRecords: recordsRes.count || 0,
      activeConditions: conditionsRes.count || 0,
      allergies: allergiesRes.count || 0,
      upcomingImmunizations,
    };

    return toolSuccess(
      overview,
      `Health overview: ${overview.activeConditions} active conditions, ${overview.activeMedications} medications, ${overview.pendingForms} pending forms, ${overview.careTeamCount} care team members.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
