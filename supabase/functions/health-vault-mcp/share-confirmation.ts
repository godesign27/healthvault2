import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.3';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value)
    .filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}

export async function confirmedShare<T extends { id: string }>(
  supabase: SupabaseClient,
  kind: 'health_share' | 'medical_form_email',
  identity: unknown,
  create: (operationId: string) => Promise<T>,
): Promise<T> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(identity)));
  const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const { data: claim, error } = await supabase.rpc('claim_share_confirmation', { p_kind: kind, p_request_key: key });
  if (error) throw new Error('Unable to verify the share confirmation. No new delivery was attempted.');
  if (claim?.status === 'completed' && claim.result) return claim.result as T;
  if (claim?.status !== 'claimed' || !claim.id) {
    throw new Error('This share confirmation is already processing or has an unverified result. Check the existing share before trying again; no additional email was sent.');
  }
  // Never release a claim automatically, even on error. The external service
  // may have accepted an email before the response was lost.
  const result = await create(claim.id);
  const { error: completionError } = await supabase.rpc('complete_share_confirmation', { p_operation_id: claim.id, p_result: result });
  if (completionError) throw new Error('The share was created, but its confirmation receipt could not be saved. Check Health Vault; do not resend.');
  return result;
}
