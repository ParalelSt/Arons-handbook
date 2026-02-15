import { supabase } from "@/lib/supabase";
import type {
  ChartDataPoint,
  ExerciseComparison,
  PersonalRecord,
  WeeklyVolumeSummary,
  WeekComparison,
} from "@/types";
import { format, parseISO, startOfWeek, getISOWeek } from "date-fns";

/**
 * Analytics & Progress Service Layer
 *
 * All heavy data computation happens here — never inside components.
 */

// ─── Exercise History ─────────────────────────────────────────────────────────

interface ExerciseHistoryRow {
  reps: number;
  weight: number;
  set_created_at: string;
  workout_date: string;
  workout_title: string | null;
}

/**
 * Get full history for an exercise by name (case-insensitive).
 * Returns sets ordered by date descending.
 */
export async function getExerciseHistory(
  exerciseName: string,
  limit = 200,
): Promise<ExerciseHistoryRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sets")
    .select(
      `
      reps,
      weight,
      created_at,
      workout_exercise:workout_exercises!inner (
        exercise:exercises!inner ( name ),
        workout:workouts!inner ( date, title, user_id )
      )
    `,
    )
    .limit(limit);

  if (error) throw error;

  // Filter in JS because Supabase doesn't support case-insensitive nested filters well
  const normalised = exerciseName.toLowerCase();
  const filtered = (data || [])
    .filter((row: Record<string, unknown>) => {
      const we = row.workout_exercise as Record<string, unknown> | null;
      if (!we) return false;
      const ex = we.exercise as { name: string } | null;
      const wo = we.workout as { user_id: string } | null;
      return ex?.name?.toLowerCase() === normalised && wo?.user_id === user.id;
    })
    .map((row: Record<string, unknown>) => {
      const we = row.workout_exercise as Record<string, unknown>;
      const wo = we.workout as { date: string; title: string | null };
      return {
        reps: row.reps as number,
        weight: row.weight as number,
        set_created_at: row.created_at as string,
        workout_date: wo.date,
        workout_title: wo.title,
      };
    })
    .sort(
      (a: ExerciseHistoryRow, b: ExerciseHistoryRow) =>
        new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime(),
    );

  return filtered;
}

// ─── Max Weight ────────────────────────────────────────────────────────────────

/**
 * Get historical max weight for an exercise (chart-ready).
 */
export async function getMaxWeightOverTime(
  exerciseName: string,
): Promise<ChartDataPoint[]> {
  const history = await getExerciseHistory(exerciseName, 500);

  // Group by date, pick max weight per date
  const dateMap = new Map<string, number>();
  for (const row of history) {
    const current = dateMap.get(row.workout_date) ?? 0;
    if (row.weight > current) {
      dateMap.set(row.workout_date, row.weight);
    }
  }

  return Array.from(dateMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Volume Over Time ──────────────────────────────────────────────────────────

/**
 * Get volume (weight × reps) over time for a specific exercise (chart-ready).
 */
export async function getVolumeOverTime(
  exerciseName: string,
): Promise<ChartDataPoint[]> {
  const history = await getExerciseHistory(exerciseName, 500);

  const dateMap = new Map<string, number>();
  for (const row of history) {
    const volume = row.weight * row.reps;
    dateMap.set(
      row.workout_date,
      (dateMap.get(row.workout_date) ?? 0) + volume,
    );
  }

  return Array.from(dateMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Weekly Volume ─────────────────────────────────────────────────────────────

/**
 * Get weekly volume summaries for the last N weeks.
 */
export async function getWeeklyVolumes(
  weeksCount = 12,
): Promise<WeeklyVolumeSummary[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      date,
      workout_exercises (
        id,
        sets ( reps, weight )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(weeksCount * 7);

  if (error) throw error;

  const weekMap = new Map<
    string,
    { totalVolume: number; totalSets: number; exerciseIds: Set<string> }
  >();

  for (const workout of data || []) {
    const wDate = parseISO(workout.date as string);
    const wStart = format(
      startOfWeek(wDate, { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    );

    if (!weekMap.has(wStart)) {
      weekMap.set(wStart, {
        totalVolume: 0,
        totalSets: 0,
        exerciseIds: new Set(),
      });
    }
    const week = weekMap.get(wStart)!;

    const exercises = (workout.workout_exercises || []) as Array<{
      id: string;
      sets: Array<{ reps: number; weight: number }>;
    }>;

    for (const we of exercises) {
      week.exerciseIds.add(we.id);
      for (const s of we.sets || []) {
        week.totalVolume += s.reps * s.weight;
        week.totalSets += 1;
      }
    }
  }

  return Array.from(weekMap.entries())
    .map(([weekStart, v]) => ({
      weekStart,
      totalVolume: Math.round(v.totalVolume),
      totalSets: v.totalSets,
      totalExercises: v.exerciseIds.size,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

// ─── Week Comparison ───────────────────────────────────────────────────────────

/**
 * Compare the two most recent weeks.
 */
export async function getWeekComparison(): Promise<WeekComparison | null> {
  const volumes = await getWeeklyVolumes(4);
  if (volumes.length < 2) return null;

  const recent = volumes.slice(-2);
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

// ─── Exercise Progress Comparison ──────────────────────────────────────────────

/**
 * For a given exercise name, find the most recent previous occurrence
 * (excluding a specific workout ID) and compare weights.
 */
export async function getExerciseComparison(
  exerciseName: string,
  currentWorkoutId: string,
  currentMaxWeight: number,
): Promise<ExerciseComparison | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Query previous workouts containing this exercise
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      `
      workout_id,
      exercise:exercises!inner ( name ),
      workout:workouts!inner ( id, date, title, user_id ),
      sets ( reps, weight )
    `,
    )
    .neq("workout_id", currentWorkoutId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const normalised = exerciseName.toLowerCase();

  type RowType = {
    workout_id: string;
    exercise: { name: string };
    workout: {
      id: string;
      date: string;
      title: string | null;
      user_id: string;
    };
    sets: Array<{ reps: number; weight: number }>;
  };

  const matching = (data || []).filter((row: Record<string, unknown>) => {
    const ex = row.exercise as { name: string } | null;
    const wo = row.workout as { user_id: string } | null;
    return ex?.name?.toLowerCase() === normalised && wo?.user_id === user.id;
  }) as unknown as RowType[];

  // Sort by workout date descending
  matching.sort(
    (a, b) =>
      new Date(b.workout.date).getTime() - new Date(a.workout.date).getTime(),
  );

  if (matching.length === 0) return null;

  const prev = matching[0];
  const prevMaxWeight = Math.max(...(prev.sets || []).map((s) => s.weight), 0);
  const prevMaxReps = Math.max(...(prev.sets || []).map((s) => s.reps), 0);

  const prevDate = parseISO(prev.workout.date);
  const weekNum = getISOWeek(prevDate);
  const dayName = format(prevDate, "EEEE");

  let trend: "up" | "down" | "same" = "same";
  if (currentMaxWeight > prevMaxWeight) trend = "up";
  else if (currentMaxWeight < prevMaxWeight) trend = "down";

  return {
    exerciseName,
    previousWeight: prevMaxWeight,
    previousReps: prevMaxReps,
    previousDate: prev.workout.date,
    previousWeekDay: `Week ${weekNum} – ${dayName}`,
    trend,
  };
}

// ─── PR Detection ──────────────────────────────────────────────────────────────

/**
 * Check if a given weight is a personal record for the exercise.
 */
export async function detectPR(
  exerciseName: string,
  weight: number,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("personal_records")
    .select("weight")
    .eq("user_id", user.id)
    .ilike("exercise_name", exerciseName)
    .order("weight", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return true; // First time → PR
  return weight > (data[0].weight as number);
}

/**
 * Save a personal record.
 */
export async function savePR(
  exerciseName: string,
  weight: number,
  reps: number,
  date: string,
): Promise<PersonalRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("personal_records")
    .insert([
      {
        user_id: user.id,
        exercise_name: exerciseName,
        weight,
        reps,
        date,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as PersonalRecord;
}

/**
 * Get all personal records for the current user, ordered by date descending.
 */
export async function getAllPRs(): Promise<PersonalRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("personal_records")
    .select("id, user_id, exercise_name, weight, reps, date, created_at")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data || []) as PersonalRecord[];
}

/**
 * Get a list of distinct exercise names for the user (for dropdowns).
 */
export async function getDistinctExerciseNames(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("exercises")
    .select("name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map((e: { name: string }) => e.name);
}

// ─── Weight Carry-Over for Templates ───────────────────────────────────────────

/**
 * For a given exercise name, find the last used weight across all workouts.
 * Returns the weight or null if none found.
 */
export async function getLastUsedWeight(
  exerciseName: string,
): Promise<number | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sets")
    .select(
      `
      weight,
      workout_exercise:workout_exercises!inner (
        exercise:exercises!inner ( name ),
        workout:workouts!inner ( date, user_id )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw error;

  const normalised = exerciseName.toLowerCase();

  for (const row of data || []) {
    const weArr = row.workout_exercise as unknown;
    if (!weArr || !Array.isArray(weArr) || weArr.length === 0) {
      // Handle when Supabase returns single object vs array
      const we = (Array.isArray(weArr) ? weArr[0] : weArr) as Record<
        string,
        unknown
      > | null;
      if (!we) continue;
      const exArr = we.exercise as unknown;
      const ex = (Array.isArray(exArr) ? exArr[0] : exArr) as {
        name: string;
      } | null;
      const woArr = we.workout as unknown;
      const wo = (Array.isArray(woArr) ? woArr[0] : woArr) as {
        user_id: string;
      } | null;
      if (ex?.name?.toLowerCase() === normalised && wo?.user_id === user.id) {
        return row.weight as number;
      }
    } else {
      const we = (Array.isArray(weArr) ? weArr[0] : weArr) as Record<
        string,
        unknown
      >;
      const exArr = we.exercise as unknown;
      const ex = (Array.isArray(exArr) ? exArr[0] : exArr) as {
        name: string;
      } | null;
      const woArr = we.workout as unknown;
      const wo = (Array.isArray(woArr) ? woArr[0] : woArr) as {
        user_id: string;
      } | null;
      if (ex?.name?.toLowerCase() === normalised && wo?.user_id === user.id) {
        return row.weight as number;
      }
    }
  }

  return null;
}
