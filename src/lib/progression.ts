/**
 * Fixed Exercise Progression Logic
 *
 * Compares an exercise's performance against the MOST RECENT completed instance
 * of that same exercise, strictly before the current workout date. Ignores
 * future/empty weeks entirely.
 */

import { supabase } from "@/lib/supabase";
import type { ExerciseComparison } from "@/types";
import { format, parseISO } from "date-fns";

/**
 * Get progression comparison for an exercise.
 *
 * Finds the most recent workout BEFORE `currentWorkoutDate` that contains
 * the named exercise with at least one set where weight > 0.
 */
export async function getExerciseProgression(
  exerciseName: string,
  currentWorkoutDate: string,
  currentMaxWeight: number,
): Promise<ExerciseComparison | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch recent workouts BEFORE the current date that have this exercise
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      id, date, title,
      workout_exercises!inner (
        exercise:exercises!inner ( name ),
        sets ( reps, weight )
      )
    `,
    )
    .eq("user_id", user.id)
    .lt("date", currentWorkoutDate)
    .order("date", { ascending: false })
    .limit(50);

  if (error || !data) return null;

  const normalised = exerciseName.toLowerCase();

  for (const workout of data) {
    const workoutExercises = (workout.workout_exercises ?? []) as Array<{
      exercise: { name: string } | { name: string }[];
      sets: Array<{ reps: number; weight: number }> | null;
    }>;

    for (const we of workoutExercises) {
      const exerciseObj = Array.isArray(we.exercise)
        ? we.exercise[0]
        : we.exercise;
      if (!exerciseObj || exerciseObj.name.toLowerCase() !== normalised) continue;

      const sets = we.sets ?? [];
      // Only consider workouts with actual completed sets (weight > 0)
      const completedSets = sets.filter((s) => s.weight > 0);
      if (completedSets.length === 0) continue;

      const maxWeight = Math.max(...completedSets.map((s) => s.weight));
      const maxReps = Math.max(...completedSets.map((s) => s.reps));

      const workoutDate = parseISO(workout.date as string);
      const dayName = format(workoutDate, "EEEE");

      let trend: "up" | "down" | "same" = "same";
      if (currentMaxWeight > maxWeight) trend = "up";
      else if (currentMaxWeight < maxWeight) trend = "down";

      return {
        exerciseName,
        previousWeight: maxWeight,
        previousReps: maxReps,
        previousDate: workout.date as string,
        previousWeekDay: `${dayName} — ${workout.title ?? ""}`.trim(),
        trend,
      };
    }
  }

  return null;
}
