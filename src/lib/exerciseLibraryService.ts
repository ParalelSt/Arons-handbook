/**
 * Exercise Library Service
 *
 * CRUD + usage tracking for the exercise_library table.
 * Items are reusable blueprints — never foreign-keyed to workouts/templates.
 */

import { supabase } from "@/lib/supabase";
import type { ExerciseLibraryItem, ExerciseLibrarySortMode } from "@/types";

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[exerciseLibrary] getAll error:", error.message);
    throw error;
  }
  return data ?? [];
}

export async function createExerciseLibraryItem(
  name: string,
  muscleGroup: string | null,
  defaultReps: number,
  defaultWeight: number,
): Promise<ExerciseLibraryItem> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("exercise_library")
    .insert({
      user_id: userId,
      name: name.trim(),
      muscle_group: muscleGroup?.trim() || null,
      default_reps: Math.max(1, defaultReps),
      default_weight: Math.max(0, defaultWeight),
    })
    .select()
    .single();

  if (error) {
    console.error("[exerciseLibrary] create error:", error.message);
    throw error;
  }
  return data;
}

export async function updateExerciseLibraryItem(
  id: string,
  updates: {
    name?: string;
    muscle_group?: string | null;
    default_reps?: number;
    default_weight?: number;
  },
): Promise<ExerciseLibraryItem> {
  const clean: Record<string, unknown> = {};
  if (updates.name !== undefined) clean.name = updates.name.trim();
  if (updates.muscle_group !== undefined)
    clean.muscle_group = updates.muscle_group?.trim() || null;
  if (updates.default_reps !== undefined)
    clean.default_reps = Math.max(1, updates.default_reps);
  if (updates.default_weight !== undefined)
    clean.default_weight = Math.max(0, updates.default_weight);

  const { data, error } = await supabase
    .from("exercise_library")
    .update(clean)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[exerciseLibrary] update error:", error.message);
    throw error;
  }
  return data;
}

export async function deleteExerciseLibraryItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("exercise_library")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[exerciseLibrary] delete error:", error.message);
    throw error;
  }
}

// ─── Usage tracking ───────────────────────────────────────────────────────────

export async function bumpExerciseUsage(id: string): Promise<void> {
  // Supabase doesn't support increment natively via JS SDK,
  // so we fetch + update (acceptable for low contention).
  const { data, error: fetchErr } = await supabase
    .from("exercise_library")
    .select("usage_count")
    .eq("id", id)
    .single();

  if (fetchErr) {
    console.error("[exerciseLibrary] bumpUsage fetch error:", fetchErr.message);
    return; // non-critical
  }

  const { error: updateErr } = await supabase
    .from("exercise_library")
    .update({
      usage_count: (data?.usage_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    console.error(
      "[exerciseLibrary] bumpUsage update error:",
      updateErr.message,
    );
  }
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

export function sortExerciseLibrary(
  items: ExerciseLibraryItem[],
  mode: ExerciseLibrarySortMode,
): ExerciseLibraryItem[] {
  const copy = [...items];

  switch (mode) {
    case "recent":
      return copy.sort((a, b) => {
        if (!a.last_used_at && !b.last_used_at) return 0;
        if (!a.last_used_at) return 1;
        if (!b.last_used_at) return -1;
        return (
          new Date(b.last_used_at).getTime() -
          new Date(a.last_used_at).getTime()
        );
      });

    case "frequent":
      return copy.sort((a, b) => b.usage_count - a.usage_count);

    case "alpha":
      return copy.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );

    case "muscle":
      return copy.sort((a, b) => {
        const ga = a.muscle_group ?? "zzz";
        const gb = b.muscle_group ?? "zzz";
        const groupCmp = ga.localeCompare(gb, undefined, {
          sensitivity: "base",
        });
        if (groupCmp !== 0) return groupCmp;
        return a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
      });

    case "created":
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    default:
      return copy;
  }
}

// ─── Grouping helper ──────────────────────────────────────────────────────────

export function groupByMuscle(
  items: ExerciseLibraryItem[],
): Map<string, ExerciseLibraryItem[]> {
  const groups = new Map<string, ExerciseLibraryItem[]>();
  for (const item of items) {
    const key = item.muscle_group || "Uncategorized";
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }
  return groups;
}
