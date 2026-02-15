/**
 * Analytics Service Layer
 *
 * All heavy data computation happens here — never inside React components.
 * Functions accept userId for explicit filtering. Use RPCs where available
 * to avoid overfetching rows to the client.
 */

import { supabase } from "@/lib/supabase";
import type {
  ChartDataPoint,
  WeeklyVolumeSummary,
  WeekComparison,
  PRSummaryRow,
} from "@/types";

// ─── Auth Helper ──────────────────────────────────────────────────────────────

export async function getAuthUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[analyticsService] Auth error:", error.message);
    throw new Error("Not authenticated");
  }
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.id;
}

// ─── Exercise Names ───────────────────────────────────────────────────────────

export async function getDistinctExerciseNames(
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("name")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error(
      "[analyticsService] getDistinctExerciseNames error:",
      error.message,
    );
    throw error;
  }

  return (data ?? []).map((e) => e.name as string);
}

// ─── Weekly Volume (RPC) ──────────────────────────────────────────────────────

export async function getWeeklyVolumes(
  userId: string,
): Promise<WeeklyVolumeSummary[]> {
  const { data, error } = await supabase.rpc("get_weekly_volume", {
    p_user_id: userId,
  });

  if (error) {
    console.error(
      "[analyticsService] getWeeklyVolumes RPC error:",
      error.message,
    );
    throw error;
  }

  if (!data || !Array.isArray(data)) return [];

  return data.map((row: Record<string, unknown>) => ({
    weekStart: String(row.week_start ?? ""),
    totalVolume: Math.round(Number(row.total_volume ?? 0)),
    totalSets: Number(row.total_sets ?? 0),
    totalExercises: Number(row.total_exercises ?? 0),
  }));
}

// ─── Max Weight Over Time (RPC) ───────────────────────────────────────────────

export async function getMaxWeightOverTime(
  userId: string,
  exerciseName: string,
): Promise<ChartDataPoint[]> {
  const { data, error } = await supabase.rpc(
    "get_exercise_max_weight_over_time",
    {
      p_user_id: userId,
      p_exercise_name: exerciseName,
    },
  );

  if (error) {
    console.error(
      "[analyticsService] getMaxWeightOverTime RPC error:",
      error.message,
    );
    throw error;
  }

  if (!data || !Array.isArray(data)) return [];

  return data.map((row: Record<string, unknown>) => ({
    date: String(row.workout_date ?? ""),
    value: Number(row.max_weight ?? 0),
  }));
}

// ─── Personal Records Summary (RPC) ──────────────────────────────────────────

export async function getPersonalRecords(
  userId: string,
): Promise<PRSummaryRow[]> {
  const { data, error } = await supabase.rpc("get_personal_records_summary", {
    p_user_id: userId,
  });

  if (error) {
    console.error(
      "[analyticsService] getPersonalRecords RPC error:",
      error.message,
    );
    throw error;
  }

  if (!data || !Array.isArray(data)) return [];

  return data.map((row: Record<string, unknown>) => ({
    exercise_name: String(row.exercise_name ?? ""),
    max_weight: Number(row.max_weight ?? 0),
    best_date: String(row.best_date ?? ""),
  }));
}

// ─── Week Comparison ──────────────────────────────────────────────────────────

export async function getWeekComparison(
  userId: string,
): Promise<WeekComparison | null> {
  const volumes = await getWeeklyVolumes(userId);
  if (volumes.length < 2) return null;

  const sorted = [...volumes].sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );
  const recent = sorted.slice(-2);
  const previous = recent[0];
  const current = recent[1];

  return {
    current,
    previous,
    volumeChange: current.totalVolume - previous.totalVolume,
    setsChange: current.totalSets - previous.totalSets,
    exercisesChange: current.totalExercises - previous.totalExercises,
  };
}

// ─── PR Detection ─────────────────────────────────────────────────────────────

/**
 * Check if newWeight is a PR for this exercise.
 * Checks against the personal_records table (tracking table).
 */
export async function detectPR(
  userId: string,
  exerciseName: string,
  newWeight: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("personal_records")
    .select("weight")
    .eq("user_id", userId)
    .ilike("exercise_name", exerciseName)
    .order("weight", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[analyticsService] detectPR error:", error.message);
    return false;
  }

  if (!data || data.length === 0) return true; // First time → PR
  return newWeight > Number(data[0].weight);
}

// ─── Exercise History (direct query, proper user_id filter) ───────────────────

export interface ExerciseHistoryRow {
  reps: number;
  weight: number;
  workout_date: string;
  workout_title: string | null;
}

export async function getExerciseHistory(
  userId: string,
  exerciseName: string,
): Promise<ExerciseHistoryRow[]> {
  // Start from workouts (has user_id) and join downward
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      date,
      title,
      workout_exercises!inner (
        exercise:exercises!inner ( name ),
        sets ( reps, weight )
      )
    `,
    )
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error(
      "[analyticsService] getExerciseHistory error:",
      error.message,
    );
    throw error;
  }

  const normalised = exerciseName.toLowerCase();
  const results: ExerciseHistoryRow[] = [];

  for (const workout of data ?? []) {
    const workoutExercises = (workout.workout_exercises ?? []) as Array<{
      exercise: { name: string } | { name: string }[];
      sets: Array<{ reps: number; weight: number }> | null;
    }>;

    for (const we of workoutExercises) {
      // Handle Supabase returning object or array for singular joins
      const exerciseObj = Array.isArray(we.exercise)
        ? we.exercise[0]
        : we.exercise;
      if (!exerciseObj || exerciseObj.name.toLowerCase() !== normalised)
        continue;

      for (const s of we.sets ?? []) {
        results.push({
          reps: s.reps,
          weight: s.weight,
          workout_date: workout.date as string,
          workout_title: (workout.title as string | null) ?? null,
        });
      }
    }
  }

  return results;
}

// ─── Last Used Weight (RPC) ───────────────────────────────────────────────────

export async function getLastUsedWeight(
  userId: string,
  exerciseName: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_last_used_weight", {
    p_user_id: userId,
    p_exercise_name: exerciseName,
  });

  if (error) {
    console.error(
      "[analyticsService] getLastUsedWeight RPC error:",
      error.message,
    );
    return null;
  }

  if (data === null || data === undefined) return null;
  return Number(data);
}
