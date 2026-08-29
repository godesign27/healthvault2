import { supabase } from './supabase';
import type { CheckInQuestionKey, WellnessInsight } from '../../packages/wellness-contracts/src/index';

export type WellnessInsightRow = { id: string; version: number; insight: WellnessInsight; generated_at: string; source_kinds: string[] };
export type WellnessState = {
  partner: { partnerKey: string; displayName: string; status: string; disclaimer: string; consentCopy: string; websiteUrl: string; cloudEnabled: boolean; branding?: Record<string, string> };
  enrollment: { active: boolean; snoozed_until?: string | null } | null;
  checkIn: { id: string; answers: Partial<Record<CheckInQuestionKey, string | null>>; skipped_questions: string[]; answered_count: number; status: 'in_progress' | 'completed' } | null;
  latestInsight: WellnessInsightRow | null;
};

const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wellness-insights`;

export async function callWellnessInsights<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to use Nourished Rebel Insights.');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ productKey: 'saas_cloud', ...body }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) throw new Error(result.error || 'Unable to load wellness insights.');
  return result as T;
}

export const getWellnessState = () => callWellnessInsights<WellnessState>({ action: 'status' });
export const enrollInWellness = () => callWellnessInsights<WellnessState>({ action: 'enroll' });
export const saveWellnessAnswer = (questionKey: CheckInQuestionKey, answer: string | null, skipped = false) => callWellnessInsights<WellnessState>({ action: 'save_answer', questionKey, answer, skipped });
export const sendWellnessFeedback = (insightId: string, target: string, rating: 'up' | 'down') => callWellnessInsights<{ saved: true }>({ action: 'feedback', insightId, target, rating });
export const getWellnessHistory = () => callWellnessInsights<{ items: WellnessInsightRow[] }>({ action: 'history' });
export const trackWellnessEvent = (eventName: string, metadata?: Record<string, unknown>) => callWellnessInsights<{ recorded: true }>({ action: 'event', eventName, metadata });
export const getWellnessPartnerCta = (correlationId: string) => callWellnessInsights<{ url: string }>({ action: 'cta', correlationId });
export const optOutWellness = () => callWellnessInsights<{ active: false }>({ action: 'opt_out' });
export const requestWellnessRefresh = () => callWellnessInsights<{ latestInsight: WellnessInsightRow }>({ action: 'generate' });
export const snoozeWellness = () => callWellnessInsights<{ snoozedUntil: string }>({ action: 'snooze' });
