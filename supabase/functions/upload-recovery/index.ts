import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { createRecoveryHandler } from './handler.ts';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } });
Deno.serve(createRecoveryHandler({
  async claim(token) {
    const { data, error } = await db.rpc('claim_upload_recovery', { p_token: token });
    if (error || !data) throw new Error('Claim unavailable');
    return data;
  },
  async abandon(id) {
    const { data, error } = await db.rpc('abandon_inbound_upload', { p_attempt_id: id });
    if (error || !data) throw new Error('Recovery unavailable');
    return data;
  },
  async remove(bucket, path) {
    const { error } = await db.storage.from(bucket).remove([path]);
    if (error) throw new Error('Removal failed');
  },
  async finish(lease, checked, failed) {
    const { data, error } = await db.rpc('finish_upload_recovery', { p_lease: lease, p_checked: checked, p_failed: failed });
    if (error || data !== true) throw new Error('Receipt unavailable');
  },
}));
