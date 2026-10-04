import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { collectAccountExport } from './export.ts';

const cors = {
  'Access-Control-Allow-Origin': 'https://healthvault.me',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store', 'Vary': 'Origin',
};
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const json = (value: unknown, status: number) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const token = req.headers.get('Authorization');
  if (!token?.startsWith('Bearer ')) return json({ error: 'Sign in to download your data.' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: token } }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return json({ error: 'Sign in to download your data.' }, 401);
  const access = await client.rpc('current_account_access_allowed');
  if (access.error) return json({ error: 'Account access could not be verified. Please try again.' }, 503);
  if (access.data !== true) return json({ error: 'This account is unavailable. Contact support.' }, 403);
  try {
    // Never accept a target user ID, table name or filter from the request body.
    return json(await collectAccountExport(client, user.id), 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Export failed. Please try again.' }, 500);
  }
});
