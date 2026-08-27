import type { GptInsightsSnapshot } from '@health-vault/analytics-contracts';
import { supabase } from '../../../lib/supabase';

function isGptInsightsSnapshot(value: unknown): value is GptInsightsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<GptInsightsSnapshot>;
  const metrics = candidate.metrics as unknown;
  const hasCompleteNarrative = Boolean(
    metrics
    && typeof metrics === 'object'
    && 'users' in metrics
    && 'interactions' in metrics
    && 'capabilityHealth' in metrics
    && 'unmetNeeds' in metrics
    && 'weeklyBrief' in metrics,
  );
  return candidate.productKey === 'gpt_app'
    && (candidate.dataStatus === 'synthetic' || candidate.dataStatus === 'live')
    && typeof candidate.snapshotId === 'string'
    && typeof candidate.generatedAt === 'string'
    && hasCompleteNarrative;
}

export async function getGptInsightsSnapshot(): Promise<GptInsightsSnapshot> {
  const { data, error } = await supabase.rpc('get_admin_gpt_insights_snapshot');
  if (error) throw new Error(error.message);
  if (!isGptInsightsSnapshot(data)) throw new Error('The GPT App metric snapshot is unavailable or invalid.');
  return data;
}
