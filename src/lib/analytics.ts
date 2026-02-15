/**
 * Analytics convenience wrappers.
 *
 * These functions get the userId from the Supabase session and delegate
 * to analyticsService. Existing imports (WorkoutDetailScreen, ExerciseProgress,
 * templates.ts, AnalyticsScreen) continue working without changes.
 */

import { supabase } from "@/lib/supabase";
import * as analyticsService from "./analyticsService";
import type {
  ChartDataPoint,
  ExerciseComparison,
  PersonalRecord,
  WeeklyVolumeSummary,
  WeekComparison,
} from "@/types";
import { format, parseISO, getISOWeek } from "date-fns";

// Re-export for consumers that import the service types
export { getAuthUserId } from "./analyticsService";
export type { ExerciseHistoryRow } from "./analyticsService";

// ─── Internal helper ──────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  return analyticsService.getAuthUserId();
}

// ─── Wrappers (preserve existing call signatures) ─────────────────────────────

export async function getDistinctExerciseNames(): Promise<string[]> {
  const userId = await requireUserId();
  return analyticsService.getDistinctExerciseNames(userId);
}

export async function getMaxWeightOverTime(
  exerciseName: string,
): Promise<ChartDataPoint[]> {
  const userId = await requireUserId();
  return analyticsService.getMaxWeightOverTime(userId, exerciseName);
}

export async function getWeeklyVolumes(
  weeksCount?: number,
): Promise<WeeklyVolumeSummary[]> {
  const userId = await requireUserId();
  const all = await analyticsService.getWeeklyVolumes(userId);
  if (weeksCount && all.length > weeksCount) {
    return all.slice(-weeksCount);
  }
  return all;
}

export async function getWeekComparison(): Promise<WeekComparison | null> {
  const userId = await requireUserId();
  return analyticsService.getWeekComparison(userId);
}

// ─── PRs from personal_records table (tracking history) ───────────────────────

export async function getAllPRs(): Promise<PersonalRecord[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("personal_records")
    .select("id, user_id, exercise_name, weight, reps, date, created_at")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("[analytics] getAllPRs error:", error.message);
    throw error;
  }
  return (data ?? []) as PersonalRecord[];
}

// ─── PR Detection & Saving ────────────────────────────────────────────────────

export async function detectPR(
  exerciseName: string,
  weight: number,
): Promise<boolean> {
  const userId = await requireUserId();
  return analyticsService.detectPR(userId, exerciseName, weight);
}

export async function savePR(
  exerciseName: string,
  weight: number,
  reps: number,
  date: string,
): Promise<PersonalRecord> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("personal_records")
    .insert([
      {
        user_id: userId,
        exercise_name: exerciseName,
        weight,
        reps,
        date,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[analytics] savePR error:", error.message);
    throw error;
  }
  return data as PersonalRecord;
}

// ─── Exercise Progress Comparison ─────────────────────────────────────────────

export async function getExerciseComparison(
  exerciseName: string,
  currentWorkoutId: string,
  currentMaxWeight: number,
): Promise<ExerciseComparison | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      id,
      date,
      title,
      workout_exercises!inner (
        exercise:exercises!inner ( name ),
        sets ( reps, weight )
      )
    `,
    )
    .eq("user_id", userId)
    .neq("id", currentWorkoutId)
    .order("date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[analytics] getExerciseComparison error:", error.message);
    throw error;
  }

  const normalised = exerciseName.toLowerCase();

  for (const workout of data ?? []) {
    const workoutExercises = (workout.workout_exercises ?? []) as Array<{
      exercise: { name: string } | { name: string }[];
      sets: Array<{ reps: number; weight: number }> | null;
    }>;

    for (const we of workoutExercises) {
      const exerciseObj = Array.isArray(we.exercise)
        ? we.exercise[0]
        : we.exercise;
      if (!exerciseObj || exerciseObj.name.toLowerCase() !== normalised)
        continue;

      const sets = we.sets ?? [];
      if (sets.length === 0) continue;

      const prevMaxWeight = Math.max(...sets.map((s) => s.weight), 0);
      const prevMaxReps = Math.max(...sets.map((s) => s.reps), 0);

      const prevDate = parseISO(workout.date as string);
      const weekNum = getISOWeek(prevDate);
      const dayName = format(prevDate, "EEEE");

      let trend: "up" | "down" | "same" = "same";
      if (currentMaxWeight > prevMaxWeight) trend = "up";
      else if (currentMaxWeight < prevMaxWeight) trend = "down";

      return {
        exerciseName,
        previousWeight: prevMaxWeight,
        previousReps: prevMaxReps,
        previousDate: workout.date as string,
        previousWeekDay: `Week ${weekNum} – ${dayName}`,
        trend,
      };
    }
  }

  return null;
}

// ─── Weight Carry-Over ────────────────────────────────────────────────────────

export async function getLastUsedWeight(
  exerciseName: string,
): Promise<number | null> {
  const userId = await requireUserId();
  return analyticsService.getLastUsedWeight(userId, exerciseName);
}
