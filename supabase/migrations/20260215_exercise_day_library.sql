-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Exercise & Day Library System
-- Date: 2026-02-15
-- Description: Reusable exercise blueprints and full-day blueprints
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Exercise Library ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exercise_library (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0),
    muscle_group text,
    default_reps integer NOT NULL DEFAULT 10 CHECK (default_reps > 0),
    default_weight numeric(10, 2) NOT NULL DEFAULT 0 CHECK (default_weight >= 0),
    usage_count integer NOT NULL DEFAULT 0,
    last_used_at timestamp
    with
        time zone,
        created_at timestamp
    with
        time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_library_user_id ON public.exercise_library (user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON public.exercise_library (name);

-- Unique per user: no duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_library_user_name ON public.exercise_library (user_id, lower(name));

ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise library items" ON public.exercise_library FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own exercise library items" ON public.exercise_library FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own exercise library items" ON public.exercise_library FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own exercise library items" ON public.exercise_library FOR DELETE USING (auth.uid () = user_id);

-- ─── Day Library ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.day_library (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0),
    created_at timestamp
    with
        time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_day_library_user_id ON public.day_library (user_id);

ALTER TABLE public.day_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day library items" ON public.day_library FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own day library items" ON public.day_library FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own day library items" ON public.day_library FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own day library items" ON public.day_library FOR DELETE USING (auth.uid () = user_id);

-- ─── Day Library Exercises ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.day_library_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    day_library_id uuid REFERENCES public.day_library (id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0),
    muscle_group text,
    order_index integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_day_library_exercises_day ON public.day_library_exercises (day_library_id);

ALTER TABLE public.day_library_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day library exercises" ON public.day_library_exercises FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.day_library
            WHERE
                day_library.id = day_library_exercises.day_library_id
                AND day_library.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert their own day library exercises" ON public.day_library_exercises FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.day_library
            WHERE
                day_library.id = day_library_exercises.day_library_id
                AND day_library.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update their own day library exercises" ON public.day_library_exercises FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.day_library
        WHERE
            day_library.id = day_library_exercises.day_library_id
            AND day_library.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete their own day library exercises" ON public.day_library_exercises FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.day_library
        WHERE
            day_library.id = day_library_exercises.day_library_id
            AND day_library.user_id = auth.uid ()
    )
);

-- ─── Day Library Sets ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.day_library_sets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    day_library_exercise_id uuid REFERENCES public.day_library_exercises (id) ON DELETE CASCADE NOT NULL,
    reps integer NOT NULL CHECK (reps > 0),
    weight numeric(10, 2) NOT NULL CHECK (weight >= 0)
);

CREATE INDEX IF NOT EXISTS idx_day_library_sets_exercise ON public.day_library_sets (day_library_exercise_id);

ALTER TABLE public.day_library_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own day library sets" ON public.day_library_sets FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.day_library_exercises dle
                JOIN public.day_library dl ON dl.id = dle.day_library_id
            WHERE
                dle.id = day_library_sets.day_library_exercise_id
                AND dl.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert their own day library sets" ON public.day_library_sets FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.day_library_exercises dle
                JOIN public.day_library dl ON dl.id = dle.day_library_id
            WHERE
                dle.id = day_library_sets.day_library_exercise_id
                AND dl.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can update their own day library sets" ON public.day_library_sets FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.day_library_exercises dle
            JOIN public.day_library dl ON dl.id = dle.day_library_id
        WHERE
            dle.id = day_library_sets.day_library_exercise_id
            AND dl.user_id = auth.uid ()
    )
);

CREATE POLICY "Users can delete their own day library sets" ON public.day_library_sets FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.day_library_exercises dle
            JOIN public.day_library dl ON dl.id = dle.day_library_id
        WHERE
            dle.id = day_library_sets.day_library_exercise_id
            AND dl.user_id = auth.uid ()
    )
);