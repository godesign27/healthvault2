import { ImportAccessError, requireActiveAccount, requireImportOwner, requireVerifiedUser } from './access.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.3';
const id = '11111111-1111-4111-8111-111111111111';
function client(options: { invalid?: boolean; blocked?: boolean; missing?: boolean; banned?: boolean; unavailable?: boolean } = {}) {
  const user = { id, banned_until: options.banned ? '2999-01-01T00:00:00Z' : undefined };
  return {
    auth: {
      getUser: async () => options.invalid ? { error: { status: 401 }, data: {} } : { data: { user } },
      admin: { getUserById: async () => options.missing ? { error: { status: 404 } } : { data: { user } } },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
      data: options.blocked ? { user_id: id } : null, error: options.unavailable ? {} : null,
    }) }) }) }),
  } as unknown as SupabaseClient;
}
async function denied(fn: () => unknown, status: number) {
  try { await fn(); } catch (e) {
    if (e instanceof ImportAccessError && e.status === status) return;
    throw e;
  }
  throw new Error('Expected denial');
}
const request = (token: string) => new Request('https://test.invalid/keys', { headers: { Authorization: `Bearer ${token}` } });
Deno.test('key management uses verified identity, rejects forged token and missing bearer', async () => {
  await denied(() => requireVerifiedUser(client({ invalid: true }), request(`e30.${btoa(JSON.stringify({ sub: id }))}.forged`)), 401);
  await denied(() => requireVerifiedUser(client(), new Request('https://test.invalid/keys')), 401);
  if (await requireVerifiedUser(client(), request('verified-fixture')) !== id) throw new Error('Wrong user');
});
Deno.test('blocked, banned and deleted owners cannot use privileged import paths', async () => {
  for (const options of [{ blocked: true }, { banned: true }, { missing: true }]) {
    await denied(() => requireActiveAccount(client(options), id), 403);
    await denied(() => requireVerifiedUser(client(options), request('old-session')), 403);
  }
});
Deno.test('missing gate infrastructure fails closed', async () => {
  await denied(() => requireActiveAccount(client({ unavailable: true }), id), 503);
});
Deno.test('personal keys cannot target another patient or rely on organization labels', async () => {
  requireImportOwner(id, id);
  await denied(() => requireImportOwner(id, '22222222-2222-4222-8222-222222222222'), 403);
});
