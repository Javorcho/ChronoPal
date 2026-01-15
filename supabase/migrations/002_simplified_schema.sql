-- ChronoPal Simplified Database Schema
-- This migration simplifies the database structure to match actual app usage
-- Run this migration in Supabase SQL Editor

-- ============================================
-- 1. BACKUP EXISTING DATA (Optional but recommended)
-- ============================================
-- CREATE TABLE activities_backup AS SELECT * FROM activities;
-- CREATE TABLE activity_exceptions_backup AS SELECT * FROM activity_exceptions;

-- ============================================
-- 2. DROP OLD UNUSED COLUMNS FROM ACTIVITIES
-- ============================================

-- Remove unused columns (if they exist)
ALTER TABLE activities DROP COLUMN IF EXISTS category_id;
ALTER TABLE activities DROP COLUMN IF EXISTS status;
ALTER TABLE activities DROP COLUMN IF EXISTS priority;
ALTER TABLE activities DROP COLUMN IF EXISTS description;
ALTER TABLE activities DROP COLUMN IF EXISTS location;
ALTER TABLE activities DROP COLUMN IF EXISTS notes;
ALTER TABLE activities DROP COLUMN IF EXISTS recurrence;
ALTER TABLE activities DROP COLUMN IF EXISTS recurrence_rule;
ALTER TABLE activities DROP COLUMN IF EXISTS recurrence_end_date;
ALTER TABLE activities DROP COLUMN IF EXISTS parent_activity_id;
ALTER TABLE activities DROP COLUMN IF EXISTS external_id;
ALTER TABLE activities DROP COLUMN IF EXISTS source;
ALTER TABLE activities DROP COLUMN IF EXISTS last_synced_at;
ALTER TABLE activities DROP COLUMN IF EXISTS timezone;

-- ============================================
-- 3. ENSURE CORE COLUMNS EXIST AND ARE CORRECT
-- ============================================

-- Ensure required columns exist with correct types
ALTER TABLE activities 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN color SET NOT NULL,
  ALTER COLUMN day SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL,
  ALTER COLUMN end_time SET NOT NULL,
  ALTER COLUMN is_recurring SET NOT NULL,
  ALTER COLUMN is_recurring SET DEFAULT false;

-- Ensure color has default
ALTER TABLE activities 
  ALTER COLUMN color SET DEFAULT '#7f78d2';

-- Ensure day is valid
ALTER TABLE activities 
  ADD CONSTRAINT check_day_valid CHECK (
    day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  );

-- ============================================
-- 3.5. FIX DATA BEFORE ADDING CONSTRAINT
-- ============================================

-- Fix rows where is_recurring = true but activity_date is set
-- For recurring activities, activity_date should be NULL
UPDATE activities 
SET activity_date = NULL 
WHERE is_recurring = true AND activity_date IS NOT NULL;

-- Fix rows where is_recurring = false but activity_date is NULL
-- For non-recurring activities, we need to set activity_date based on day
-- This is a best-effort fix - we'll use the current week's date for that day
UPDATE activities 
SET activity_date = (
  CASE day
    WHEN 'monday' THEN date_trunc('week', CURRENT_DATE)::DATE
    WHEN 'tuesday' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '1 day')::DATE
    WHEN 'wednesday' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '2 days')::DATE
    WHEN 'thursday' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '3 days')::DATE
    WHEN 'friday' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '4 days')::DATE
    WHEN 'saturday' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '5 days')::DATE
    WHEN 'sunday' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::DATE
  END
)
WHERE is_recurring = false AND activity_date IS NULL;

-- ============================================
-- 3.6. ADD CONSTRAINT FOR RECURRING LOGIC
-- ============================================

-- Add constraint for recurring logic (after data is fixed)
ALTER TABLE activities 
  DROP CONSTRAINT IF EXISTS check_recurring_logic,
  ADD CONSTRAINT check_recurring_logic CHECK (
    (is_recurring = true AND activity_date IS NULL) OR
    (is_recurring = false AND activity_date IS NOT NULL)
  );

-- ============================================
-- 4. UPDATE INDEXES
-- ============================================

-- Drop old indexes that might reference removed columns
DROP INDEX IF EXISTS idx_activities_category_id;
DROP INDEX IF EXISTS idx_activities_external_id;
DROP INDEX IF EXISTS idx_activities_source;

-- Create optimized indexes for actual usage patterns
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date) WHERE activity_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_user_day ON activities(user_id, day) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_activities_user_date_range ON activities(user_id, activity_date) WHERE activity_date IS NOT NULL;

-- ============================================
-- 5. ACTIVITY_EXCEPTIONS TABLE (Keep as-is, already correct)
-- ============================================
-- The activity_exceptions table structure is already correct
-- No changes needed

-- ============================================
-- 6. OPTIONAL: DROP UNUSED TABLES
-- ============================================
-- Uncomment these if you want to completely remove unused tables
-- WARNING: This will delete all data in these tables!

-- DROP TABLE IF EXISTS reminders CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- ============================================
-- 7. VERIFY STRUCTURE
-- ============================================
-- Run this to verify the structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'activities'
-- ORDER BY ordinal_position;

-- ============================================
-- DONE! Your database is now simplified.
-- ============================================
