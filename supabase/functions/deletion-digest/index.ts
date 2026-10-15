import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { createHandler } from './handler.ts';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } });
const handler = createHandler({
  async claim(token, verification) {
    const { data, error } = await db.rpc('claim_deletion_digest', { p_token: token, p_verification: verification });
    if (error || !data) throw new Error('Claim unavailable');
    return data;
  },
  async send(message, key) {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('Mail not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(25000), redirect: 'error',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify({ from: 'Health Vault <team@healthvault.me>', to: ['godesigngo@gmail.com'],
        reply_to: 'team@healthvault.me', ...message }),
    });
    if (!response.ok) throw new Error('Mail rejected');
    const result = await response.json();
    if (typeof result.id !== 'string' || !result.id) throw new Error('Missing mail receipt');
    return result.id;
  },
  async finish(claim, id, errorCode) {
    const { data, error } = await db.rpc('finish_deletion_digest', {
      p_key: claim.run_key, p_lease: claim.lease_token, p_provider_id: id, p_error: errorCode,
    });
    if (error || data !== true) throw new Error('Receipt not saved');
  },
});
Deno.serve(handler);
