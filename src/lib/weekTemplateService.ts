/**
 * Week Template Service Layer
 *
 * CRUD for the week_templates → day_templates → exercise_templates → template_sets
 * hierarchy. All functions accept explicit userId where needed.
 */

import { supabase } from "@/lib/supabase";
import type { WeekTemplate, WeekTemplateWithDays, SaveDayInput } from "@/types";
import { getAuthUserId, getLastUsedWeight } from "@/lib/analyticsService";
import { format } from "date-fns";

// ─── List all week templates (shallow) ────────────────────────────────────────

export async function getAllWeekTemplates(): Promise<WeekTemplate[]> {
  const userId = await getAuthUserId();

  const { data, error } = await supabase
    .from("week_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[weekTemplateService] getAllWeekTemplates error:",
      error.message,
    );
    throw error;
  }
  return data ?? [];
}

// ─── Get single template with full nesting ────────────────────────────────────

export async function getWeekTemplateById(
  id: string,
): Promise<WeekTemplateWithDays> {
  const { data, error } = await supabase
    .from("week_templates")
    .select(
      `
      *,
      day_templates (
        *,
        exercise_templates (
          *,
          template_sets (*)
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error(
      "[weekTemplateService] getWeekTemplateById error:",
      error.message,
    );
    throw error;
  }

  // Supabase returns nested arrays properly thanks to FK relationships
  return data as unknown as WeekTemplateWithDays;
}

// ─── Create empty week template ───────────────────────────────────────────────

export async function createWeekTemplate(name: string): Promise<WeekTemplate> {
  const userId = await getAuthUserId();

  const { data, error } = await supabase
    .from("week_templates")
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) {
    console.error(
      "[weekTemplateService] createWeekTemplate error:",
      error.message,
    );
    throw error;
  }
  return data;
}

// ─── Save full template (replace children) ────────────────────────────────────

/**
 * Deletes all existing children (days → exercises → sets cascade-deleted)
 * and re-inserts the full hierarchy from the form state.
 */
export async function saveWeekTemplateFull(
  templateId: string,
  templateName: string,
  days: SaveDayInput[],
): Promise<void> {
  const userId = await getAuthUserId();

  // 1. Update template name
  const { error: nameErr } = await supabase
    .from("week_templates")
    .update({ name: templateName })
    .eq("id", templateId);

  if (nameErr) {
    console.error(
      "[weekTemplateService] saveWeekTemplateFull name update error:",
      nameErr.message,
    );
    throw nameErr;
  }

  // 2. Delete old day_templates (cascade deletes exercises + sets)
  const { error: delErr } = await supabase
    .from("day_templates")
    .delete()
    .eq("template_id", templateId);

  if (delErr) {
    console.error(
      "[weekTemplateService] saveWeekTemplateFull delete days error:",
      delErr.message,
    );
    throw delErr;
  }

  // 3. Re-insert the full hierarchy
  for (const day of days) {
    // Insert day
    const { data: dayRow, error: dayErr } = await supabase
      .from("day_templates")
      .insert({ template_id: templateId, name: day.name })
      .select()
      .single();

    if (dayErr) {
      console.error("[weekTemplateService] insert day error:", dayErr.message);
      throw dayErr;
    }

    for (const exercise of day.exercises) {
      // Sync to exercise library so Exercises tab stays up-to-date
      if (exercise.name.trim()) {
        await findOrCreateExercise(userId, exercise.name.trim());
      }

      // Insert exercise into template hierarchy
      const { data: exRow, error: exErr } = await supabase
        .from("exercise_templates")
        .insert({ day_template_id: dayRow.id, name: exercise.name })
        .select()
        .single();

      if (exErr) {
        console.error(
          "[weekTemplateService] insert exercise error:",
          exErr.message,
        );
        throw exErr;
      }

      // Insert sets
      if (exercise.sets.length > 0) {
        const setsToInsert = exercise.sets.map((s) => ({
          exercise_template_id: exRow.id,
          reps: Math.max(1, s.reps),
          weight: Math.max(0, s.weight),
        }));

        const { error: setsErr } = await supabase
          .from("template_sets")
          .insert(setsToInsert);

        if (setsErr) {
          console.error(
            "[weekTemplateService] insert sets error:",
            setsErr.message,
          );
          throw setsErr;
        }
      }
    }
  }
}

// ─── Delete week template ─────────────────────────────────────────────────────

export async function deleteWeekTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("week_templates").delete().eq("id", id);

  if (error) {
    console.error(
      "[weekTemplateService] deleteWeekTemplate error:",
      error.message,
    );
    throw error;
  }
}

// ─── Generate real workouts from template ─────────────────────────────────────

/**
 * Creates real Workout + WorkoutExercise + Set rows from a week template.
 * Uses weight carry-over: for each exercise, fetch the last used weight from
 * the user's workout history via the RPC; fall back to the template weight.
 */
export async function generateWeekFromTemplate(
  templateId: string,
  weekStartDate: Date,
): Promise<string[]> {
  const userId = await getAuthUserId();
  const template = await getWeekTemplateById(templateId);

  const DAY_OFFSETS: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  const createdWorkoutIds: string[] = [];

  for (const day of template.day_templates) {
    const offset = DAY_OFFSETS[day.name] ?? 0;
    const workoutDate = new Date(weekStartDate);
    workoutDate.setDate(workoutDate.getDate() + offset);
    const dateStr = format(workoutDate, "yyyy-MM-dd");

    // 1. Create workout
    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        date: dateStr,
        title: `${day.name} — ${template.name}`,
      })
      .select()
      .single();

    if (wErr) {
      console.error(
        "[weekTemplateService] generateWeek create workout error:",
        wErr.message,
      );
      throw wErr;
    }

    createdWorkoutIds.push(workout.id);

    // 2. For each exercise template
    for (let i = 0; i < day.exercise_templates.length; i++) {
      const exTemplate = day.exercise_templates[i];

      // Find or create the exercise row in the exercises table
      const exerciseId = await findOrCreateExercise(userId, exTemplate.name);

      // Create workout_exercise
      const { data: we, error: weErr } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workout.id,
          exercise_id: exerciseId,
          order_index: i,
        })
        .select()
        .single();

      if (weErr) {
        console.error(
          "[weekTemplateService] generateWeek create we error:",
          weErr.message,
        );
        throw weErr;
      }

      // 3. For each template set, try carry-over weight
      const setsToInsert = [];
      for (let j = 0; j < exTemplate.template_sets.length; j++) {
        const tSet = exTemplate.template_sets[j];
        let weight = tSet.weight;

        // Weight carry-over: use last used weight if available
        try {
          const lastWeight = await getLastUsedWeight(userId, exTemplate.name);
          if (lastWeight !== null && lastWeight > 0) {
            weight = lastWeight;
          }
        } catch {
          // Fallback to template weight
        }

        setsToInsert.push({
          workout_exercise_id: we.id,
          reps: tSet.reps,
          weight,
          order_index: j,
        });
      }

      if (setsToInsert.length > 0) {
        const { error: sErr } = await supabase
          .from("sets")
          .insert(setsToInsert);
        if (sErr) {
          console.error(
            "[weekTemplateService] generateWeek insert sets error:",
            sErr.message,
          );
          throw sErr;
        }
      }
    }
  }

  return createdWorkoutIds;
}

// ─── Helper: find or create exercise by name ──────────────────────────────────

async function findOrCreateExercise(
  userId: string,
  name: string,
): Promise<string> {
  // Try to find existing exercise (case-insensitive)
  const { data: existing, error: findErr } = await supabase
    .from("exercises")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .limit(1);

  if (findErr) {
    console.error(
      "[weekTemplateService] findOrCreateExercise find error:",
      findErr.message,
    );
    throw findErr;
  }

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  // Create new exercise
  const { data: created, error: createErr } = await supabase
    .from("exercises")
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (createErr) {
    console.error(
      "[weekTemplateService] findOrCreateExercise create error:",
      createErr.message,
    );
    throw createErr;
  }

  return created.id;
}

// ─── List all days from all week templates ────────────────────────────────────

export interface DayTemplateInfo {
  id: string;
  name: string;
  weekTemplateId: string;
  weekTemplateName: string;
  exercises: { id: string; name: string }[];
}

export async function getAllDayTemplatesWithWeekNames(): Promise<
  DayTemplateInfo[]
> {
  const weekTemplates = await getAllWeekTemplates();
  if (weekTemplates.length === 0) return [];

  const weekIds = weekTemplates.map((wt) => wt.id);

  const { data, error } = await supabase
    .from("day_templates")
    .select("id, name, template_id, exercise_templates(id, name)")
    .in("template_id", weekIds)
    .order("name");

  if (error) {
    console.error("[weekTemplateService] getAllDayTemplates error:", error.message);
    throw error;
  }

  return (data ?? []).map((d) => {
    const wt = weekTemplates.find((w) => w.id === d.template_id);
    return {
      id: d.id,
      name: d.name,
      weekTemplateId: d.template_id,
      weekTemplateName: wt?.name ?? "",
      exercises: (d.exercise_templates as { id: string; name: string }[]) ?? [],
    };
  });
}

// ─── Create a workout from a single day template ──────────────────────────────

export async function createWorkoutFromDayTemplate(
  dayTemplateId: string,
  date: string,
): Promise<string> {
  const userId = await getAuthUserId();

  // Get day with exercises + sets
  const { data: day, error: dayErr } = await supabase
    .from("day_templates")
    .select(
      "id, name, exercise_templates(id, name, template_sets(reps, weight))",
    )
    .eq("id", dayTemplateId)
    .single();

  if (dayErr || !day) throw new Error(dayErr?.message ?? "Day template not found");

  // Create workout shell
  const { data: workout, error: wErr } = await supabase
    .from("workouts")
    .insert({ user_id: userId, date, title: day.name })
    .select("id")
    .single();

  if (wErr || !workout) throw new Error(wErr?.message ?? "Failed to create workout");

  // Insert exercises with weight carry-over (same logic as generateWeekFromTemplate)
  const exTemplates = day.exercise_templates as {
    id: string;
    name: string;
    template_sets: { reps: number; weight: number }[];
  }[];

  for (let i = 0; i < exTemplates.length; i++) {
    const et = exTemplates[i];
    const exerciseId = await findOrCreateExercise(userId, et.name);

    const { data: we, error: weErr } = await supabase
      .from("workout_exercises")
      .insert({ workout_id: workout.id, exercise_id: exerciseId, order_index: i })
      .select("id")
      .single();

    if (weErr || !we) throw new Error(weErr?.message ?? "Failed to create workout exercise");

    const setsToInsert = [];
    for (let j = 0; j < et.template_sets.length; j++) {
      const s = et.template_sets[j];
      let weight = s.weight;
      try {
        const lastWeight = await getLastUsedWeight(userId, et.name);
        if (lastWeight !== null && lastWeight > 0) weight = lastWeight;
      } catch {
        // Fallback to template weight
      }
      setsToInsert.push({
        workout_exercise_id: we.id,
        reps: s.reps,
        weight,
        order_index: j,
      });
    }

    if (setsToInsert.length > 0) {
      const { error: sErr } = await supabase.from("sets").insert(setsToInsert);
      if (sErr) throw new Error(sErr.message);
    }
  }

  return workout.id;
}
