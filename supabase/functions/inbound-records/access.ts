import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";

export class ImportAccessError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Service-role imports bypass RLS, so they must check the account explicitly.
// This is a request-time guard, not a transactional job/erasure interlock.
export async function requireActiveAccount(client: SupabaseClient, userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId ?? "")) {
    throw new ImportAccessError(403, "Account unavailable.");
  }
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error) {
    throw new ImportAccessError(error.status === 404 ? 403 : 503, "Account unavailable.");
  }
  const user = data?.user;
  const bannedUntil = user?.banned_until;
  if (!user || user.id !== userId || (bannedUntil &&
      (!Number.isFinite(Date.parse(bannedUntil)) || Date.parse(bannedUntil) > Date.now()))) {
    throw new ImportAccessError(403, "Account unavailable.");
  }
  const block = await client.from("account_erasure_blocks").select("user_id")
    .eq("user_id", userId).maybeSingle();
  if (block.error) throw new ImportAccessError(503, "Account verification unavailable.");
  if (block.data) throw new ImportAccessError(403, "Account unavailable.");
}

export async function requireVerifiedUser(client: SupabaseClient, req: Request): Promise<string> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ") || header.length > 8192 || !header.slice(7).trim()) {
    throw new ImportAccessError(401, "Authentication required.");
  }
  // Never authorize by decoding claims: gateway JWT verification is disabled for API keys.
  const { data, error } = await client.auth.getUser(header.slice(7));
  if (error || !data?.user) throw new ImportAccessError(401, "Authentication required.");
  await requireActiveAccount(client, data.user.id);
  return data.user.id;
}

export function requireImportOwner(ownerId: string, patientId: string) {
  // Organization-name strings are not patient consent. Until explicit patient grants
  // exist, a personal key can import only into its creator's Vault.
  if (ownerId !== patientId) throw new ImportAccessError(403, "Key is not authorized for this patient.");
}
