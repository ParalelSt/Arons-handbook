import { supabase } from "@/lib/supabase";
import { getLastUsedWeight } from "@/lib/analytics";
import type {
  WorkoutTemplate,
  WorkoutTemplateWithExercises,
  CreateTemplateInput,
  CreateTemplateExerciseInput,
  CreateWorkoutInput,
} from "@/types";

/**
 * Workout Template Management
 */
export const templateApi = {
  // Get all templates
  async getAll(): Promise<WorkoutTemplateWithExercises[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("workout_templates")
      .select(
        `
        *,
        template_exercises (
          *,
          exercise:exercises (*)
        )
      `,
      )
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map((template: any) => ({
      ...template,
      template_exercises: (template.template_exercises || [])
        .map((te: any) => te)
        .sort((a: any, b: any) => a.order_index - b.order_index),
    }));
  },

  // Get single template
  async getById(id: string): Promise<WorkoutTemplateWithExercises> {
    const { data, error } = await supabase
      .from("workout_templates")
      .select(
        `
        *,
        template_exercises (
          *,
          exercise:exercises (*)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      ...data,
      template_exercises: (data.template_exercises || []).sort(
        (a: any, b: any) => a.order_index - b.order_index,
      ),
    };
  },

  // Create template
  async create(
    input: CreateTemplateInput,
  ): Promise<WorkoutTemplateWithExercises> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: template, error: templateError } = await supabase
      .from("workout_templates")
      .insert([
        {
          user_id: user.id,
          name: input.name,
          description: input.description,
        },
      ])
      .select()
      .single();

    if (templateError) throw templateError;

    // Add exercises to template
    for (let i = 0; i < input.exercises.length; i++) {
      const ex = input.exercises[i];
      const { error: exError } = await supabase
        .from("template_exercises")
        .insert([
          {
            template_id: template.id,
            exercise_id: ex.exercise_id,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            target_weight: ex.target_weight,
            notes: ex.notes,
            order_index: i,
          },
        ]);

      if (exError) throw exError;
    }

    return this.getById(template.id);
  },

  // Update template
  async update(
    id: string,
    input: Partial<WorkoutTemplate>,
  ): Promise<WorkoutTemplateWithExercises> {
    const { error } = await supabase
      .from("workout_templates")
      .update(input)
      .eq("id", id);

    if (error) throw error;
    return this.getById(id);
  },

  // Update template with exercises
  async updateWithExercises(
    id: string,
    input: Partial<WorkoutTemplate> & {
      exercises?: CreateTemplateExerciseInput[];
    },
  ): Promise<WorkoutTemplateWithExercises> {
    // Update template metadata
    const { error: metaError } = await supabase
      .from("workout_templates")
      .update({
        name: input.name,
        description: input.description,
      })
      .eq("id", id);

    if (metaError) throw metaError;

    // If exercises provided, delete old ones and recreate
    if (input.exercises) {
      const { data: oldExercises, error: fetchError } = await supabase
        .from("template_exercises")
        .select("id")
        .eq("template_id", id);

      if (fetchError) throw fetchError;

      // Delete all old exercises
      for (const te of oldExercises || []) {
        const { error: delError } = await supabase
          .from("template_exercises")
          .delete()
          .eq("id", te.id);
        if (delError) throw delError;
      }

      // Insert new exercises
      for (let i = 0; i < input.exercises.length; i++) {
        const ex = input.exercises[i];
        const { error: exError } = await supabase
          .from("template_exercises")
          .insert([
            {
              template_id: id,
              exercise_id: ex.exercise_id,
              target_sets: ex.target_sets,
              target_reps: ex.target_reps,
              target_weight: ex.target_weight,
              notes: ex.notes,
              order_index: i,
            },
          ]);

        if (exError) throw exError;
      }
    }

    return this.getById(id);
  },

  // Delete template
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Copy template (create duplicate)
  async copy(
    templateId: string,
    newName: string,
  ): Promise<WorkoutTemplateWithExercises> {
    const original = await this.getById(templateId);

    const input: CreateTemplateInput = {
      name: newName,
      description: original.description,
      exercises: original.template_exercises.map((te) => ({
        exercise_id: te.exercise_id,
        target_sets: te.target_sets,
        target_reps: te.target_reps || undefined,
        target_weight: te.target_weight || undefined,
        notes: te.notes || undefined,
      })),
    };

    return this.create(input);
  },

  // Create workout from template
  async createWorkoutFromTemplate(
    templateId: string,
    date: string,
    title?: string,
  ): Promise<string> {
    const template = await this.getById(templateId);

    // Import workoutApi to check for existing workouts
    const { workoutApi } = await import("./api");

    // Check if a workout with the same title already exists on this date
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const workoutTitle = title || template.name;
    const { data: existingWorkouts, error: checkError } = await supabase
      .from("workouts")
      .select("id, title")
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("title", workoutTitle);

    if (checkError) throw checkError;

    if (existingWorkouts && existingWorkouts.length > 0) {
      throw new Error(
        `A workout named "${workoutTitle}" already exists on ${date}. Please delete it first or choose a different date.`,
      );
    }

    const workoutInput: CreateWorkoutInput = {
      date,
      title: workoutTitle,
      notes: template.description || undefined,
      exercises: await Promise.all(
        template.template_exercises.map(async (te) => {
          // Weight carry-over: try last used weight, fall back to template default
          let weight = te.target_weight ?? 0;
          if (te.exercise?.name) {
            try {
              const lastWeight = await getLastUsedWeight(te.exercise.name);
              if (lastWeight !== null) {
                weight = lastWeight;
              }
            } catch {
              // Fall back to template default on error
            }
          }

          return {
            exercise_id: te.exercise_id,
            sets: Array(Math.max(1, te.target_sets || 1))
              .fill(null)
              .map(() => ({
                reps: te.target_reps && te.target_reps > 0 ? te.target_reps : 1,
                weight,
              })),
            notes: te.notes || undefined,
          };
        }),
      ),
    };

    const workout = await workoutApi.create(workoutInput);
    return workout.id;
  },
};
