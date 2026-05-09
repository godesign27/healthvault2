/*
  # Fix Security Issues

  ## Issues Addressed

  1. **Function Search Path Mutable** — `public.enforce_single_active_address` had a mutable
     search_path, allowing search_path injection attacks. Fixed by adding `SET search_path = ''`
     and qualifying all table references with the `public` schema.

  2. **Public Bucket Listing — `profile-images`** — Broad SELECT policy allowed any client to
     enumerate all files in the bucket via the PostgREST API. Dropped the policy; public bucket
     URLs remain accessible without it.

  3. **Public Bucket Listing — `shares`** — Same issue as above. Dropped the broad SELECT policy.

  4. **Anon Can Execute SECURITY DEFINER Function** — `update_updated_at_column()` was callable by
     the `anon` role via `/rest/v1/rpc/`. Revoked EXECUTE from both `anon` and `authenticated`
     (trigger functions should only be invoked by the trigger mechanism, not via RPC).

  5. **Authenticated Can Execute SECURITY DEFINER Function** — Same function, same fix.

  ## Changes

  - `public.enforce_single_active_address`: recreated with `SET search_path = ''` and fully
    qualified table name `public.user_addresses`
  - `public.update_updated_at_column`: recreated with `SET search_path = ''`; EXECUTE revoked
    from `anon` and `authenticated`
  - Dropped `Public read access for profile images` SELECT policy on `storage.objects`
  - Dropped `Public read access for shares` SELECT policy on `storage.objects`
*/

-- ── 1. Fix enforce_single_active_address search_path ─────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_single_active_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.user_addresses
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 2. Fix update_updated_at_column: set search_path + revoke RPC access ─────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger functions only need to be called by the trigger mechanism.
-- Revoking RPC access from end-user roles closes the SECURITY DEFINER exposure.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- ── 3. Remove broad SELECT (listing) policies from public storage buckets ─────
-- Public bucket files are still reachable via their public URL.
-- These SELECT policies only enable PostgREST enumeration — not needed for URL access.

DROP POLICY IF EXISTS "Public read access for profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for shares" ON storage.objects;
