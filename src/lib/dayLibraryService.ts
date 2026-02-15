/**
 * Day Library Service
 *
 * CRUD for the day_library → day_library_exercises → day_library_sets hierarchy.
 * Items are reusable full-day blueprints — always cloned, never referenced.
 */

import { supabase } from "@/lib/supabase";
import type { DayLibraryItem } from "@/types";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── List all days (with exercises + sets) ────────────────────────────────────

export async function getAllDayLibraryItems(): Promise<DayLibraryItem[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("day_library")
    .select(
      `
      *,
      day_library_exercises (
        *,
        day_library_sets (*)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dayLibrary] getAll error:", error.message);
    throw error;
  }

  // Sort exercises by order_index within each day
  return (data ?? []).map((day) => ({
    ...day,
    day_library_exercises: (day.day_library_exercises ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index,
    ),
  })) as DayLibraryItem[];
}

// ─── Get single day ───────────────────────────────────────────────────────────

export async function getDayLibraryItemById(
  id: string,
): Promise<DayLibraryItem> {
  const { data, error } = await supabase
    .from("day_library")
    .select(
      `
      *,
      day_library_exercises (
        *,
        day_library_sets (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("[dayLibrary] getById error:", error.message);
    throw error;
  }

  return {
    ...data,
    day_library_exercises: (data.day_library_exercises ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) =>
        a.order_index - b.order_index,
    ),
  } as DayLibraryItem;
}

// ─── Create day library item ──────────────────────────────────────────────────

interface CreateDayExerciseInput {
  name: string;
  muscle_group?: string | null;
  sets: { reps: number; weight: number }[];
}

export async function createDayLibraryItem(
  name: string,
  exercises: CreateDayExerciseInput[],
): Promise<DayLibraryItem> {
  const userId = await requireUserId();

  // 1. Create the day
  const { data: dayRow, error: dayErr } = await supabase
    .from("day_library")
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();

  if (dayErr) {
    console.error("[dayLibrary] create day error:", dayErr.message);
    throw dayErr;
  }

  // 2. Insert exercises + sets
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];

    const { data: exRow, error: exErr } = await supabase
      .from("day_library_exercises")
      .insert({
        day_library_id: dayRow.id,
        name: ex.name.trim(),
        muscle_group: ex.muscle_group?.trim() || null,
        order_index: i,
      })
      .select()
      .single();

    if (exErr) {
      console.error("[dayLibrary] insert exercise error:", exErr.message);
      throw exErr;
    }

    if (ex.sets.length > 0) {
      const setsToInsert = ex.sets.map((s) => ({
        day_library_exercise_id: exRow.id,
        reps: Math.max(1, s.reps),
        weight: Math.max(0, s.weight),
      }));

      const { error: setsErr } = await supabase
        .from("day_library_sets")
        .insert(setsToInsert);

      if (setsErr) {
        console.error("[dayLibrary] insert sets error:", setsErr.message);
        throw setsErr;
      }
    }
  }

  return getDayLibraryItemById(dayRow.id);
}

// ─── Save day to library from template form state ─────────────────────────────

interface SaveDayToLibraryInput {
  name: string;
  exercises: {
    name: string;
    muscle_group?: string | null;
    sets: { reps: number; weight: number }[];
  }[];
}

export async function saveDayToLibrary(
  input: SaveDayToLibraryInput,
): Promise<DayLibraryItem> {
  return createDayLibraryItem(input.name, input.exercises);
}

// ─── Delete day library item ──────────────────────────────────────────────────

export async function deleteDayLibraryItem(id: string): Promise<void> {
  const { error } = await supabase.from("day_library").delete().eq("id", id);

  if (error) {
    console.error("[dayLibrary] delete error:", error.message);
    throw error;
  }
}
