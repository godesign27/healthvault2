-- Restrict share-event access to the authenticated owner while supporting
-- both newer auth-user IDs and legacy patient-profile IDs.
DROP POLICY IF EXISTS "Users can view all share events (demo)" ON public.share_events;
DROP POLICY IF EXISTS "Users can insert own share events" ON public.share_events;
DROP POLICY IF EXISTS "Users can update own share events" ON public.share_events;
DROP POLICY IF EXISTS "Users can insert share events" ON public.share_events;
DROP POLICY IF EXISTS "Users can update share events" ON public.share_events;

CREATE POLICY "Users can view own share events"
  ON public.share_events FOR SELECT TO authenticated
  USING (
    patient_id = (select auth.uid())::text
    OR patient_id IN (
      SELECT id::text FROM public.patient_profiles
      WHERE user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Users can insert own share events"
  ON public.share_events FOR INSERT TO authenticated
  WITH CHECK (
    patient_id = (select auth.uid())::text
    OR patient_id IN (
      SELECT id::text FROM public.patient_profiles
      WHERE user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Users can update own share events"
  ON public.share_events FOR UPDATE TO authenticated
  USING (
    patient_id = (select auth.uid())::text
    OR patient_id IN (
      SELECT id::text FROM public.patient_profiles
      WHERE user_id = (select auth.uid())::text
    )
  )
  WITH CHECK (
    patient_id = (select auth.uid())::text
    OR patient_id IN (
      SELECT id::text FROM public.patient_profiles
      WHERE user_id = (select auth.uid())::text
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_share_events_share_token_unique
  ON public.share_events (share_token)
  WHERE share_token IS NOT NULL;
