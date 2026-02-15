-- ================================================================
-- Migration: Weekly Template System + Analytics RPC Functions
-- Date: 2026-02-15
-- ================================================================

-- ─── 1. Week Template Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.week_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0),
    created_at timestamp
    with
        time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.day_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    template_id uuid REFERENCES public.week_templates (id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0)
);

CREATE TABLE IF NOT EXISTS public.exercise_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    day_template_id uuid REFERENCES public.day_templates (id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0)
);

CREATE TABLE IF NOT EXISTS public.template_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    exercise_template_id uuid REFERENCES public.exercise_templates (id) ON DELETE CASCADE NOT NULL,
    reps integer NOT NULL CHECK (reps > 0),
    weight numeric(10, 2) NOT NULL CHECK (weight >= 0)
);

-- ─── 2. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_week_templates_user_id ON public.week_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_day_templates_template_id ON public.day_templates (template_id);

CREATE INDEX IF NOT EXISTS idx_exercise_templates_day_id ON public.exercise_templates (day_template_id);

CREATE INDEX IF NOT EXISTS idx_template_sets_exercise_id ON public.template_sets (exercise_template_id);

-- ─── 3. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.week_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.day_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.template_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their week templates" ON public.week_templates FOR ALL USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can manage their day templates" ON public.day_templates FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.week_templates wt
        WHERE
            wt.id = day_templates.template_id
            AND wt.user_id = auth.uid ()
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.week_templates wt
            WHERE
                wt.id = day_templates.template_id
                AND wt.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can manage their exercise templates" ON public.exercise_templates FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.day_templates dt
            JOIN public.week_templates wt ON wt.id = dt.template_id
        WHERE
            dt.id = exercise_templates.day_template_id
            AND wt.user_id = auth.uid ()
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.day_templates dt
                JOIN public.week_templates wt ON wt.id = dt.template_id
            WHERE
                dt.id = exercise_templates.day_template_id
                AND wt.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can manage their template sets" ON public.template_sets FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.exercise_templates et
            JOIN public.day_templates dt ON dt.id = et.day_template_id
            JOIN public.week_templates wt ON wt.id = dt.template_id
        WHERE
            et.id = template_sets.exercise_template_id
            AND wt.user_id = auth.uid ()
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.exercise_templates et
                JOIN public.day_templates dt ON dt.id = et.day_template_id
                JOIN public.week_templates wt ON wt.id = dt.template_id
            WHERE
                et.id = template_sets.exercise_template_id
                AND wt.user_id = auth.uid ()
        )
    );

-- ─── 4. Analytics RPC Functions ───────────────────────────────────────────────

-- Weekly volume aggregation (avoids fetching all sets to frontend)
CREATE OR REPLACE FUNCTION public.get_weekly_volume(p_user_id uuid)
RETURNS TABLE(
    week_start text,
    total_volume numeric,
    total_sets bigint,
    total_exercises bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        to_char(date_trunc('week', w.date), 'YYYY-MM-DD') AS week_start,
        COALESCE(SUM(s.weight * s.reps), 0) AS total_volume,
        COUNT(s.id) AS total_sets,
        COUNT(DISTINCT we.id) AS total_exercises
    FROM workouts w
    JOIN workout_exercises we ON we.workout_id = w.id
    JOIN sets s ON s.workout_exercise_id = we.id
    WHERE w.user_id = p_user_id
    GROUP BY date_trunc('week', w.date)
    ORDER BY week_start;
$$;

-- Max weight over time for a specific exercise (chart-ready)
CREATE OR REPLACE FUNCTION public.get_exercise_max_weight_over_time(
    p_user_id uuid,
    p_exercise_name text
)
RETURNS TABLE(
    workout_date text,
    max_weight numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        to_char(w.date, 'YYYY-MM-DD') AS workout_date,
        MAX(s.weight) AS max_weight
    FROM workouts w
    JOIN workout_exercises we ON we.workout_id = w.id
    JOIN exercises e ON e.id = we.exercise_id
    JOIN sets s ON s.workout_exercise_id = we.id
    WHERE w.user_id = p_user_id
      AND lower(e.name) = lower(p_exercise_name)
    GROUP BY w.date
    ORDER BY w.date;
$$;

-- Personal records summary: highest weight per exercise from actual workout data
CREATE OR REPLACE FUNCTION public.get_personal_records_summary(p_user_id uuid)
RETURNS TABLE(
    exercise_name text,
    max_weight numeric,
    best_date text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT ON (e.name)
        e.name AS exercise_name,
        s.weight AS max_weight,
        to_char(w.date, 'YYYY-MM-DD') AS best_date
    FROM exercises e
    JOIN workout_exercises we ON we.exercise_id = e.id
    JOIN workouts w ON w.id = we.workout_id
    JOIN sets s ON s.workout_exercise_id = we.id
    WHERE w.user_id = p_user_id
    ORDER BY e.name, s.weight DESC, w.date DESC;
$$;

-- Last used weight for an exercise (for weight carry-over)
CREATE OR REPLACE FUNCTION public.get_last_used_weight(
    p_user_id uuid,
    p_exercise_name text
)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT s.weight
    FROM sets s
    JOIN workout_exercises we ON we.id = s.workout_exercise_id
    JOIN exercises e ON e.id = we.exercise_id
    JOIN workouts w ON w.id = we.workout_id
    WHERE w.user_id = p_user_id
      AND lower(e.name) = lower(p_exercise_name)
    ORDER BY w.date DESC, s.created_at DESC
    LIMIT 1;
$$;