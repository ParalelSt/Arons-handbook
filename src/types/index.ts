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
