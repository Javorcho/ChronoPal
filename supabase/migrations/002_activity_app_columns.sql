-- App UI extensions (Option B): recurrence end, location, description
-- Safe to re-run. Run after 000_initial_schema.sql on existing projects.

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
