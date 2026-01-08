-- ChronoPal Database Schema Improvements
-- Run this migration in Supabase SQL Editor

-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#7f78d2',
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. ACTIVITIES TABLE IMPROVEMENTS
-- ============================================

-- Add date-based scheduling (specific date instead of just day of week)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_date DATE;

-- Add category reference
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add external calendar tracking
ALTER TABLE activities ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add activity status
ALTER TABLE activities ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';

-- Add description (rename notes or keep both)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS description TEXT;

-- Add location
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add priority
ALTER TABLE activities ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium';

-- Better recurrence support
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurrence_rule TEXT; -- RRULE format
ALTER TABLE activities ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS parent_activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Add timezone support
ALTER TABLE activities ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_external_id ON activities(external_id);
CREATE INDEX IF NOT EXISTS idx_activities_source ON activities(source);

-- ============================================
-- 3. REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  type VARCHAR(20) DEFAULT 'notification', -- 'notification', 'email', 'push'
  message TEXT,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Reminders policies
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Index for finding due reminders
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(remind_at) WHERE sent = false;

-- ============================================
-- 4. ACTIVITY EXCEPTIONS TABLE (for recurring events)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  exception_type VARCHAR(20) NOT NULL, -- 'cancelled', 'modified'
  modified_start_time TIME,
  modified_end_time TIME,
  modified_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, exception_date)
);

-- Enable RLS
ALTER TABLE activity_exceptions ENABLE ROW LEVEL SECURITY;

-- Exceptions policies (access via activity ownership)
CREATE POLICY "Users can manage exceptions for own activities" ON activity_exceptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_exceptions.activity_id 
      AND activities.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. DEFAULT CATEGORIES (Insert for new users via trigger)
-- ============================================
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon) VALUES
    (NEW.id, 'Work', '#3B82F6', 'briefcase'),
    (NEW.id, 'Personal', '#8B5CF6', 'person'),
    (NEW.id, 'Health', '#10B981', 'fitness'),
    (NEW.id, 'Education', '#F59E0B', 'school'),
    (NEW.id, 'Social', '#EC4899', 'people');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users (only if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- ============================================
-- 6. HELPER FUNCTION: Generate recurring instances
-- ============================================
CREATE OR REPLACE FUNCTION get_activities_for_date_range(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  color VARCHAR,
  activity_date DATE,
  start_time TIME,
  end_time TIME,
  status VARCHAR,
  category_id UUID,
  is_recurring BOOLEAN,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.color,
    COALESCE(a.activity_date, p_start_date) as activity_date,
    a.start_time::TIME,
    a.end_time::TIME,
    a.status,
    a.category_id,
    a.is_recurring,
    a.source
  FROM activities a
  WHERE a.user_id = p_user_id
    AND (
      -- Specific date activities
      (a.activity_date IS NOT NULL AND a.activity_date BETWEEN p_start_date AND p_end_date)
      OR
      -- Legacy day-of-week activities (recurring weekly)
      (a.activity_date IS NULL AND a.is_recurring = true)
    )
    AND NOT EXISTS (
      SELECT 1 FROM activity_exceptions ae
      WHERE ae.activity_id = a.id
      AND ae.exception_date BETWEEN p_start_date AND p_end_date
      AND ae.exception_type = 'cancelled'
    )
  ORDER BY a.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. UPDATE EXISTING ACTIVITIES (Migration)
-- ============================================
-- Set activity_date for existing activities based on day column
-- This is a one-time migration - run manually if needed

-- Example: Set dates for current week based on day column
-- UPDATE activities 
-- SET activity_date = (
--   CASE day
--     WHEN 'monday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '0 days'
--     WHEN 'tuesday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '1 days'
--     WHEN 'wednesday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '2 days'
--     WHEN 'thursday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '3 days'
--     WHEN 'friday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '4 days'
--     WHEN 'saturday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '5 days'
--     WHEN 'sunday' THEN date_trunc('week', CURRENT_DATE) + INTERVAL '6 days'
--   END
-- )
-- WHERE activity_date IS NULL;

-- ============================================
-- DONE! Your schema is now improved.
-- ============================================
