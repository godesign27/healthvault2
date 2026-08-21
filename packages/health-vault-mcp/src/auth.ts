import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Request } from "express";
import type { ServerConfig } from "./config.js";

export type AuthenticatedRequest = {
  accessToken: string;
  user: User;
  supabase: SupabaseClient;
};

function readBearerToken(request: Request): string | null {
  const authorization = request.header("authorization");
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function authenticateRequest(
  request: Request,
  config: ServerConfig,
): Promise<AuthenticatedRequest | null> {
  const accessToken = readBearerToken(request);
  if (!accessToken) return null;

  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return { accessToken, user: data.user, supabase };
}
