-- ================================================================
-- Migration: v2.0 — Analytics, PRs, Weight Carry-Over, Security
-- Date: 2026-02-14
-- ================================================================

-- ─── 1. Personal Records Table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.personal_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    exercise_name text NOT NULL,
    weight numeric(10, 2) NOT NULL CHECK (weight >= 0),
    reps integer NOT NULL CHECK (reps > 0),
    date date NOT NULL,
    created_at timestamp
    with
        time zone DEFAULT now() NOT NULL
);

-- ─── 2. Indexes ───────────────────────────────────────────────────────────────

-- Personal records indexes
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON public.personal_records (user_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_exercise_name ON public.personal_records (exercise_name);

CREATE INDEX IF NOT EXISTS idx_personal_records_date ON public.personal_records (date);

-- Additional performance indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_sets_created_at ON public.sets (created_at);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts (user_id, date);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_created_at ON public.workout_exercises (created_at);

-- ─── 3. RLS on personal_records ───────────────────────────────────────────────

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal records" ON public.personal_records FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own personal records" ON public.personal_records FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own personal records" ON public.personal_records FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own personal records" ON public.personal_records FOR DELETE USING (auth.uid () = user_id);

-- ─── 4. RLS on exercise_goals (if not already enabled) ───────────────────────

ALTER TABLE public.exercise_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe recreation)
DO $$
BEGIN
  -- Only create if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercise_goals' AND policyname = 'Users can view their own exercise goals'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own exercise goals" ON public.exercise_goals FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercise_goals' AND policyname = 'Users can insert their own exercise goals'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own exercise goals" ON public.exercise_goals FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercise_goals' AND policyname = 'Users can update their own exercise goals'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own exercise goals" ON public.exercise_goals FOR UPDATE USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercise_goals' AND policyname = 'Users can delete their own exercise goals'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own exercise goals" ON public.exercise_goals FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─── 5. Fix mutable search_path on functions ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 6. Additional indexes for exercise_goals ────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_exercise_goals_user_id ON public.exercise_goals (user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_goals_exercise_id ON public.exercise_goals (exercise_id);