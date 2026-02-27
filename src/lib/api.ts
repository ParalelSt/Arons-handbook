import { supabase } from "@/lib/supabase";
import type {
  Exercise,
  Workout,
  WorkoutWithExercises,
  WeekWorkouts,
  CreateWorkoutInput,
  Set,
  ExerciseGoal,
} from "@/types";
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";

/**
 * Exercise Management
 */
export const exerciseApi = {
  // Get all exercises for the current user
  async getAll(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create a new exercise
  async create(name: string): Promise<Exercise> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("exercises")
      .insert([{ name, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update exercise name
  async update(id: string, name: string): Promise<Exercise> {
    const { data, error } = await supabase
      .from("exercises")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete an exercise
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("exercises").delete().eq("id", id);

    if (error) throw error;
  },
};

/**
 * Workout Management
 */
export const workoutApi = {
  // Get workouts grouped by week
  async getByWeeks(startDate?: Date, endDate?: Date): Promise<WeekWorkouts[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          *,
          exercise:exercises (*),
          sets (*)
        )
      `
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (startDate) {
      query = query.gte("date", format(startDate, "yyyy-MM-dd"));
    }
    if (endDate) {
      query = query.lte("date", format(endDate, "yyyy-MM-dd"));
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group workouts by week
    const weekMap = new Map<string, WorkoutWithExercises[]>();

    (data || []).forEach((workout: any) => {
      const workoutDate = parseISO(workout.date);
      const weekStart = startOfWeek(workoutDate, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }

      // Sort exercises and sets by order_index
      const workoutWithExercises: WorkoutWithExercises = {
        ...workout,
        workout_exercises: (workout.workout_exercises || [])
          .map((we: any) => ({
            ...we,
            sets: (we.sets || []).sort(
              (a: any, b: any) => a.order_index - b.order_index
            ),
          }))
          .sort((a: any, b: any) => a.order_index - b.order_index),
      };

      weekMap.get(weekKey)!.push(workoutWithExercises);
    });

    // Convert to array and add week ranges
    return Array.from(weekMap.entries()).map(([weekStart, workouts]) => {
      const weekStartDate = parseISO(weekStart);
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

      return {
        weekStart,
        weekEnd: format(weekEndDate, "yyyy-MM-dd"),
        workouts: workouts.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      };
    });
  },

  // Get a single workout with all details
  async getById(id: string): Promise<WorkoutWithExercises> {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          *,
          exercise:exercises (*),
          sets (*)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Sort exercises and sets by order_index
    const workoutWithExercises: WorkoutWithExercises = {
      ...data,
      workout_exercises: (data.workout_exercises || [])
        .map((we: any) => ({
          ...we,
          sets: (we.sets || []).sort(
            (a: any, b: any) => a.order_index - b.order_index
          ),
        }))
        .sort((a: any, b: any) => a.order_index - b.order_index),
    };

    return workoutWithExercises;
  },

  // Create a new workout
  async create(input: CreateWorkoutInput): Promise<WorkoutWithExercises> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Create workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert([
        {
          user_id: user.id,
          date: input.date,
          title: input.title,
          notes: input.notes,
        },
      ])
      .select()
      .single();

    if (workoutError) throw workoutError;

    // Create workout exercises and sets
    for (let i = 0; i < input.exercises.length; i++) {
      const exerciseInput = input.exercises[i];

      const { data: workoutExercise, error: exerciseError } = await supabase
        .from("workout_exercises")
        .insert([
          {
            workout_id: workout.id,
            exercise_id: exerciseInput.exercise_id,
            notes: exerciseInput.notes,
            order_index: i,
          },
        ])
        .select()
        .single();

      if (exerciseError) throw exerciseError;

      // Create sets with safety checks to satisfy DB constraints
      if (exerciseInput.sets.length > 0) {
        const sets = exerciseInput.sets.map((set, j) => ({
          workout_exercise_id: workoutExercise.id,
          reps: Math.max(1, set.reps ?? 0),
          weight: Math.max(0, set.weight ?? 0),
          order_index: j,
        }));

        const { error: setsError } = await supabase.from("sets").insert(sets);

        if (setsError) throw setsError;
      }
    }

    // Fetch and return the complete workout
    return this.getById(workout.id);
  },

  // Update a workout
  async update(
    id: string,
    updates: Partial<Workout>
  ): Promise<WorkoutWithExercises> {
    const { error } = await supabase
      .from("workouts")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    return this.getById(id);
  },

  // Delete a workout
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("workouts").delete().eq("id", id);

    if (error) throw error;
  },

  // Get last week's workout with the same title (for copying weights)
  async getPreviousWeekWorkout(
    title: string,
    currentDate: string
  ): Promise<WorkoutWithExercises | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Calculate 7 days before the current date
    const currentDateObj = parseISO(currentDate);
    const oneWeekBefore = new Date(currentDateObj);
    oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
    const oneWeekBeforeStr = format(oneWeekBefore, "yyyy-MM-dd");

    // Look for a workout with the same title within the previous week
    const { data, error } = await supabase
      .from("workouts")
      .select(
        `
        *,
        workout_exercises (
          *,
          exercise:exercises (*),
          sets (*)
        )
      `
      )
      .eq("user_id", user.id)
      .eq("title", title)
      .gte("date", oneWeekBeforeStr)
      .lt("date", currentDateObj.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Sort exercises and sets by order_index
    const workout = data[0];
    const workoutWithExercises: WorkoutWithExercises = {
      ...workout,
      workout_exercises: (workout.workout_exercises || [])
        .map((we: any) => ({
          ...we,
          sets: (we.sets || []).sort(
            (a: any, b: any) => a.order_index - b.order_index
          ),
        }))
        .sort((a: any, b: any) => a.order_index - b.order_index),
    };

    return workoutWithExercises;
  },
};

/**
 * Set Management
 */
export const setApi = {
  // Update a set's reps and/or weight
  async update(
    id: string,
    updates: { reps?: number; weight?: number }
  ): Promise<Set> {
    const { data, error } = await supabase
      .from("sets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Live Workout Exercise Management
 *
 * Used exclusively by EditWorkoutDayScreen to mutate a live workout's exercises
 * and sets. Never touches template tables — clone-not-link enforced at this layer.
 */
export const workoutExerciseApi = {
  /**
   * Full save: replaces all exercises + sets on a workout to match the given
   * FormExercise list (order preserved via order_index).
   *
   * Strategy per exercise:
   *  - existingId present  → update order_index, delete+reinsert sets
   *  - existingId absent   → look up / create exercises row, insert workout_exercise + sets
   *
   * Exercises in DB but absent from the list are deleted (with their sets, which
   * cascade via FK).
   */
  async saveAll(
    workoutId: string,
    exercises: Array<{
      clientId: string;
      name: string;
      sets: { reps: number; weight: number }[];
      workoutExerciseId?: string;
    }>,
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Fetch current workout_exercises IDs
    const { data: currentRows, error: fetchErr } = await supabase
      .from("workout_exercises")
      .select("id")
      .eq("workout_id", workoutId);
    if (fetchErr) throw fetchErr;

    const currentIds = new Set((currentRows ?? []).map((r: { id: string }) => r.id));
    const keepIds = new Set(
      exercises
        .filter((e) => e.workoutExerciseId)
        .map((e) => e.workoutExerciseId as string),
    );

    // 2. Delete exercises removed by the user
    for (const id of currentIds) {
      if (!keepIds.has(id)) {
        const { error } = await supabase
          .from("workout_exercises")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
    }

    // 3. Save each exercise in order
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];

      if (ex.workoutExerciseId) {
        // 3a. Update order_index on existing row
        const { error: updateErr } = await supabase
          .from("workout_exercises")
          .update({ order_index: i })
          .eq("id", ex.workoutExerciseId);
        if (updateErr) throw updateErr;

        // 3b. Delete and reinsert sets (cleanest way to sync order)
        const { error: delSetsErr } = await supabase
          .from("sets")
          .delete()
          .eq("workout_exercise_id", ex.workoutExerciseId);
        if (delSetsErr) throw delSetsErr;

        if (ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((s, j) => ({
            workout_exercise_id: ex.workoutExerciseId as string,
            reps: Math.max(1, s.reps || 1),
            weight: Math.max(0, s.weight || 0),
            order_index: j,
          }));
          const { error: insertSetsErr } = await supabase
            .from("sets")
            .insert(setsToInsert);
          if (insertSetsErr) throw insertSetsErr;
        }
      } else {
        // 3c. New exercise — find or create the exercises table row
        const trimmedName = ex.name.trim();
        if (!trimmedName) continue;

        let exerciseId: string;

        const { data: existing } = await supabase
          .from("exercises")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", trimmedName)
          .maybeSingle();

        if (existing) {
          exerciseId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabase
            .from("exercises")
            .insert([{ name: trimmedName, user_id: user.id }])
            .select("id")
            .single();
          if (createErr) throw createErr;
          exerciseId = created.id;
        }

        const { data: newWE, error: weErr } = await supabase
          .from("workout_exercises")
          .insert([{ workout_id: workoutId, exercise_id: exerciseId, order_index: i }])
          .select("id")
          .single();
        if (weErr) throw weErr;

        if (ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((s, j) => ({
            workout_exercise_id: newWE.id,
            reps: Math.max(1, s.reps || 1),
            weight: Math.max(0, s.weight || 0),
            order_index: j,
          }));
          const { error: insertSetsErr } = await supabase
            .from("sets")
            .insert(setsToInsert);
          if (insertSetsErr) throw insertSetsErr;
        }
      }
    }
  },
};

/**
 * Exercise Goals Management
 */
export const goalApi = {
  // Get all goals for the current user
  async getAll(): Promise<ExerciseGoal[]> {
    const { data, error } = await supabase
      .from("exercise_goals")
      .select("*, exercise:exercises(*)")
      .order("exercise_id", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get goal for a specific exercise
  async getByExerciseId(exerciseId: string): Promise<ExerciseGoal | null> {
    const { data, error } = await supabase
      .from("exercise_goals")
      .select("*, exercise:exercises(*)")
      .eq("exercise_id", exerciseId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data || null;
  },

  // Create or update a goal
  async upsert(
    exerciseId: string,
    targetReps?: number,
    targetWeight?: number
  ): Promise<ExerciseGoal> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("exercise_goals")
      .upsert(
        {
          exercise_id: exerciseId,
          user_id: user.id,
          target_reps: targetReps,
          target_weight: targetWeight,
        },
        { onConflict: "user_id,exercise_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a goal
  async delete(exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from("exercise_goals")
      .delete()
      .eq("exercise_id", exerciseId);

    if (error) throw error;
  },
};
