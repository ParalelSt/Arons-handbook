/**
 * Core type definitions for the Gym LogBook app
 */

// Database types
export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ExerciseGoal {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise?: Exercise;
  target_reps?: number;
  target_weight?: number;
  created_at: string;
  updated_at: string;
}

export interface Set {
  id: string;
  workout_exercise_id: string;
  reps: number;
  weight: number; // in kg or lbs
  order_index: number; // Order of the set
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise?: Exercise; // Populated via join
  sets?: Set[]; // Populated via join
  notes?: string;
  order_index: number; // Order in the workout
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  title?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Workout Templates
export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise?: Exercise;
  target_sets: number;
  target_reps?: number;
  target_weight?: number;
  notes?: string;
  order_index: number;
  created_at: string;
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  template_exercises: (TemplateExercise & {
    exercise: Exercise;
  })[];
}

// View types for UI
export interface WorkoutWithExercises extends Workout {
  workout_exercises: (WorkoutExercise & {
    exercise: Exercise;
    sets: Set[];
  })[];
}

export interface WeekWorkouts {
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string; // YYYY-MM-DD (Sunday)
  workouts: WorkoutWithExercises[];
}

// Form types
export interface CreateSetInput {
  reps: number;
  weight: number;
}

export interface CreateWorkoutExerciseInput {
  exercise_id: string;
  sets: CreateSetInput[];
  notes?: string;
}

export interface CreateWorkoutInput {
  date: string;
  title?: string;
  notes?: string;
  exercises: CreateWorkoutExerciseInput[];
}

export interface CreateTemplateExerciseInput {
  exercise_id: string;
  target_sets: number;
  target_reps?: number;
  target_weight?: number;
  notes?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  exercises: CreateTemplateExerciseInput[];
}

// Personal Records
export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
  created_at: string;
}

// Exercise Progress Comparison
export interface ExerciseComparison {
  exerciseName: string;
  previousWeight: number;
  previousReps: number;
  previousDate: string;
  previousWeekDay: string;
  trend: "up" | "down" | "same";
}

// Analytics chart data point
export interface ChartDataPoint {
  date: string;
  value: number;
}

// Weekly volume summary
export interface WeeklyVolumeSummary {
  weekStart: string;
  totalVolume: number;
  totalSets: number;
  totalExercises: number;
}

// Week comparison
export interface WeekComparison {
  current: WeeklyVolumeSummary;
  previous: WeeklyVolumeSummary;
  volumeChange: number;
  setsChange: number;
  exercisesChange: number;
}

// ─── RPC Return Types ─────────────────────────────────────────────────────────

export interface PRSummaryRow {
  exercise_name: string;
  max_weight: number;
  best_date: string;
}

// ─── Week Template Types ──────────────────────────────────────────────────────

export interface WeekTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DayTemplate {
  id: string;
  template_id: string;
  name: string;
}

export interface ExerciseTemplate {
  id: string;
  day_template_id: string;
  name: string;
}

export interface TemplateSet {
  id: string;
  exercise_template_id: string;
  reps: number;
  weight: number;
}

export interface ExerciseTemplateWithSets extends ExerciseTemplate {
  template_sets: TemplateSet[];
}

export interface DayTemplateWithExercises extends DayTemplate {
  exercise_templates: ExerciseTemplateWithSets[];
}

export interface WeekTemplateWithDays extends WeekTemplate {
  day_templates: DayTemplateWithExercises[];
}

// ─── Week Template Form Types ─────────────────────────────────────────────────

export interface SaveSetInput {
  reps: number;
  weight: number;
}

export interface SaveExerciseInput {
  name: string;
  sets: SaveSetInput[];
}

export interface SaveDayInput {
  name: string;
  exercises: SaveExerciseInput[];
}

// ─── Shared Day Editor Form Types ─────────────────────────────────────────────
// Used by both EditWeekTemplateScreen (templates) and EditWorkoutDayScreen (live
// workouts). clientId is a stable React key that survives reordering without
// causing input focus loss.

export interface FormSet {
  reps: number;
  weight: number;
}

export interface FormExercise {
  /** Stable React key — assign crypto.randomUUID() on creation, never change it */
  clientId: string;
  name: string;
  sets: FormSet[];
}

// ─── Exercise Library Types ───────────────────────────────────────────────────

export interface ExerciseLibraryItem {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  default_reps: number;
  default_weight: number;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

export type ExerciseLibrarySortMode =
  | "recent"
  | "frequent"
  | "alpha"
  | "muscle"
  | "created";

// ─── Day Library Types ────────────────────────────────────────────────────────

export interface DayLibrarySet {
  id: string;
  day_library_exercise_id: string;
  reps: number;
  weight: number;
}

export interface DayLibraryExercise {
  id: string;
  day_library_id: string;
  name: string;
  muscle_group: string | null;
  order_index: number;
  day_library_sets: DayLibrarySet[];
}

export interface DayLibraryItem {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  day_library_exercises: DayLibraryExercise[];
}
