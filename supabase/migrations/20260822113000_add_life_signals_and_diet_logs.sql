CREATE TABLE IF NOT EXISTS public.life_signal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  energy smallint NOT NULL CHECK (energy BETWEEN 1 AND 5),
  sleep smallint NOT NULL CHECK (sleep BETWEEN 1 AND 5),
  mood smallint NOT NULL CHECK (mood BETWEEN 1 AND 5),
  stress smallint NOT NULL CHECK (stress BETWEEN 1 AND 5),
  pain smallint NOT NULL CHECK (pain BETWEEN 1 AND 5),
  note text CHECK (char_length(note) <= 2000),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'chatgpt' CHECK (source IN ('chatgpt', 'web', 'import')),
  confirmation_status text NOT NULL DEFAULT 'confirmed' CHECK (confirmation_status IN ('proposed', 'confirmed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS life_signal_entries_user_recorded_idx
  ON public.life_signal_entries (user_id, recorded_at DESC);

ALTER TABLE public.life_signal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own life signals" ON public.life_signal_entries
  FOR SELECT TO authenticated USING (user_id = (select auth.uid())::text);
CREATE POLICY "Users can insert own life signals" ON public.life_signal_entries
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid())::text);
CREATE POLICY "Users can update own life signals" ON public.life_signal_entries
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())::text) WITH CHECK (user_id = (select auth.uid())::text);
CREATE POLICY "Users can delete own life signals" ON public.life_signal_entries
  FOR DELETE TO authenticated USING (user_id = (select auth.uid())::text);

CREATE TABLE IF NOT EXISTS public.diet_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'drink', 'other')),
  consumed_at timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(items) = 'array'),
  water_ml integer CHECK (water_ml IS NULL OR water_ml BETWEEN 0 AND 20000),
  notes text CHECK (char_length(notes) <= 2000),
  source text NOT NULL DEFAULT 'chatgpt' CHECK (source IN ('chatgpt', 'web', 'import')),
  confirmation_status text NOT NULL DEFAULT 'confirmed' CHECK (confirmation_status IN ('proposed', 'confirmed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diet_log_entries_user_consumed_idx
  ON public.diet_log_entries (user_id, consumed_at DESC);

ALTER TABLE public.diet_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diet logs" ON public.diet_log_entries
  FOR SELECT TO authenticated USING (user_id = (select auth.uid())::text);
CREATE POLICY "Users can insert own diet logs" ON public.diet_log_entries
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid())::text);
CREATE POLICY "Users can update own diet logs" ON public.diet_log_entries
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())::text) WITH CHECK (user_id = (select auth.uid())::text);
CREATE POLICY "Users can delete own diet logs" ON public.diet_log_entries
  FOR DELETE TO authenticated USING (user_id = (select auth.uid())::text);

