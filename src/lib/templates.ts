import { supabase } from "@/lib/supabase";
import type {
  WorkoutTemplate,
  WorkoutTemplateWithExercises,
  CreateTemplateInput,
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
      `
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
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      ...data,
      template_exercises: (data.template_exercises || []).sort(
        (a: any, b: any) => a.order_index - b.order_index
      ),
    };
  },

  // Create template
  async create(
    input: CreateTemplateInput
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
    input: Partial<WorkoutTemplate>
  ): Promise<WorkoutTemplateWithExercises> {
    const { error } = await supabase
      .from("workout_templates")
      .update(input)
      .eq("id", id);

    if (error) throw error;
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
    newName: string
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
    title?: string
  ): Promise<string> {
    const template = await this.getById(templateId);
    console.log("Template data:", template); // Debug log

    const workoutInput: CreateWorkoutInput = {
      date,
      title: title || template.name,
      notes: template.description || undefined,
      exercises: template.template_exercises.map((te) => ({
        exercise_id: te.exercise_id,
        sets: Array(te.target_sets)
          .fill({})
          .map(() => ({
            reps: te.target_reps || 10, // Default to 10 reps instead of 0
            weight: te.target_weight || 0,
          })),
        notes: te.notes || undefined,
      })),
    };

    console.log("Creating workout with input:", workoutInput); // Debug log

    // Import workoutApi locally to avoid circular dependency
    const { workoutApi } = await import("./api");
    const workout = await workoutApi.create(workoutInput);
    console.log("Created workout:", workout); // Debug log
    return workout.id;
  },
};
