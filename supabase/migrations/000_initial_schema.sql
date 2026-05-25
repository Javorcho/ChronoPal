-- ChronoPal — canonical schema (thesis §3.4.1–3.4.3)
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.
-- Requires: Supabase Auth (auth.users).

-- ============================================
-- 3.4.1 activities
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7f78d2',
  day TEXT NOT NULL CHECK (day IN (
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
  )),
  activity_date DATE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_end_date DATE,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Recurring: activity_date must be NULL; one-time: activity_date must be set
  CONSTRAINT activities_recurrence_date_check CHECK (
    (is_recurring = true AND activity_date IS NULL)
    OR (is_recurring = false AND activity_date IS NOT NULL)
  )
);

-- Upgrade legacy activities table (first bootstrap without activity_date)
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_date DATE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;

-- Backfill one-time rows that lack activity_date (derive from day, current week)
UPDATE public.activities
SET activity_date = (
  date_trunc('week', CURRENT_DATE)::date + CASE day
    WHEN 'monday' THEN 0 WHEN 'tuesday' THEN 1 WHEN 'wednesday' THEN 2
    WHEN 'thursday' THEN 3 WHEN 'friday' THEN 4 WHEN 'saturday' THEN 5
    WHEN 'sunday' THEN 6 ELSE 0
  END
)
WHERE activity_date IS NULL AND is_recurring = false;

-- Remaining NULL dates are weekly recurring rules
UPDATE public.activities
SET is_recurring = true
WHERE activity_date IS NULL;

-- Add CHECK only if missing (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activities_recurrence_date_check'
      AND conrelid = 'public.activities'::regclass
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_recurrence_date_check CHECK (
        (is_recurring = true AND activity_date IS NULL)
        OR (is_recurring = false AND activity_date IS NOT NULL)
      );
  END IF;
END $$;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;

CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3.4.2 activity_exceptions
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL DEFAULT 'cancelled' CHECK (exception_type IN ('cancelled', 'modified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (activity_id, exception_date)
);

ALTER TABLE public.activity_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage exceptions for own activities" ON public.activity_exceptions;

CREATE POLICY "Users can manage exceptions for own activities"
  ON public.activity_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.activities
      WHERE activities.id = activity_exceptions.activity_id
        AND activities.user_id = auth.uid()
    )
  );

-- ============================================
-- 3.4.3 indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activities_date
  ON public.activities (activity_date);

CREATE INDEX IF NOT EXISTS idx_activities_user_date
  ON public.activities (user_id, activity_date);

-- Optional: keep updated_at in sync on UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS activities_set_updated_at ON public.activities;
CREATE TRIGGER activities_set_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- Realtime: publish activity changes so the app can subscribe
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'activity_exceptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_exceptions;
  END IF;
END $$;
