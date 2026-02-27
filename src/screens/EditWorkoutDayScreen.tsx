/**
 * EditWorkoutDayScreen
 *
 * Full exercise editor for a single live workout day.
 * Mirrors the UX of EditWeekTemplateScreen — same DayEditorPanel, same card
 * layout, same drag-and-drop. Editing here NEVER modifies any template table.
 *
 * Flow:
 *  1. Load workout via workoutApi.getById
 *  2. Map workout_exercises → LiveExercise[] (extends FormExercise with DB ids)
 *  3. Render DayEditorPanel — user edits locally
 *  4. On save → workoutExerciseApi.saveAll (clone-not-link enforced in API)
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Toast } from "@/components/ui/Toast";
import { DayEditorPanel } from "@/components/ui/DayEditorPanel";
import { workoutApi, workoutExerciseApi } from "@/lib/api";
import type { FormExercise } from "@/types";
import { format, parseISO } from "date-fns";
import { Save } from "lucide-react";

// ─── Local type: FormExercise extended with DB ids ────────────────────────────
// workoutExerciseId: references workout_exercises.id (undefined for new exercises)
// dbExerciseId: references exercises.id (undefined for new exercises)

interface LiveExercise extends FormExercise {
  workoutExerciseId?: string;
  dbExerciseId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditWorkoutDayScreen() {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();

  const [workoutTitle, setWorkoutTitle] = useState("");
  const [workoutDate, setWorkoutDate] = useState("");
  const [weekStart, setWeekStart] = useState<string | null>(null);

  const [liveExercises, setLiveExercises] = useState<LiveExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // ─── Load workout ────────────────────────────────────────────────────────────

  const loadWorkout = useCallback(async () => {
    if (!workoutId) return;
    try {
      setLoading(true);
      setError("");
      const data = await workoutApi.getById(workoutId);

      setWorkoutTitle(data.title || "");
      setWorkoutDate(data.date);

      // Derive the week start for back-navigation
      const dateObj = parseISO(data.date);
      const dow = dateObj.getDay(); // 0=Sun
      const diff = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(dateObj);
      monday.setDate(dateObj.getDate() + diff);
      setWeekStart(format(monday, "yyyy-MM-dd"));

      // Map to LiveExercise (stable clientIds)
      const mapped: LiveExercise[] = (data.workout_exercises ?? []).map(
        (we) => ({
          clientId: crypto.randomUUID(),
          name: we.exercise?.name ?? "",
          sets: (we.sets ?? []).map((s) => ({
            reps: s.reps,
            weight: s.weight,
          })),
          workoutExerciseId: we.id,
          dbExerciseId: we.exercise_id,
        }),
      );
      setLiveExercises(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load workout";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  // ─── DayEditorPanel onChange ─────────────────────────────────────────────────
  // Panel returns plain FormExercise[]. We merge back the DB ids by clientId so
  // we never lose the reference on reorder.

  function handleExercisesChange(newExercises: FormExercise[]) {
    const merged: LiveExercise[] = newExercises.map((ex) => {
      const existing = liveExercises.find((l) => l.clientId === ex.clientId);
      return {
        ...ex,
        workoutExerciseId: existing?.workoutExerciseId,
        dbExerciseId: existing?.dbExerciseId,
      };
    });
    setLiveExercises(merged);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!workoutId) return;

    const validExercises = liveExercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      setError("Add at least one exercise with a name.");
      return;
    }

    // Validate sets
    for (const ex of validExercises) {
      if (ex.sets.length === 0) {
        setError(`"${ex.name}" has no sets. Add at least one set.`);
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      await workoutExerciseApi.saveAll(workoutId, validExercises);
      setToast("Workout saved!");
      // Reload to sync DB state (picks up any generated IDs for new exercises)
      await loadWorkout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ─── Back navigation ─────────────────────────────────────────────────────────

  function handleBack() {
    if (weekStart) {
      navigate(`/week/${weekStart}`);
    } else {
      navigate(-1);
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container>
        <Header title="Edit Day" onBack={handleBack} />
        <div className="container mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-800/50 rounded-xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      </Container>
    );
  }

  const headerTitle = workoutDate
    ? `${format(parseISO(workoutDate), "EEEE")}${workoutTitle ? ` — ${workoutTitle}` : ""}`
    : "Edit Day";

  const breadcrumbItems = [
    { label: "Home", onClick: () => navigate("/") },
    ...(weekStart
      ? [{ label: "Week", onClick: () => navigate(`/week/${weekStart}`) }]
      : []),
    { label: "Edit Day" },
  ];

  return (
    <Container>
      <Header
        title={headerTitle}
        onBack={handleBack}
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* Date badge */}
        {workoutDate && (
          <p className="text-slate-500 text-xs">
            {format(parseISO(workoutDate), "MMMM d, yyyy")}
          </p>
        )}

        {/* Exercise editor — same panel as template builder */}
        <Card className="p-4">
          <DayEditorPanel
            exercises={liveExercises}
            onChange={handleExercisesChange}
            showImportDay
          />
        </Card>

        {/* Bottom save */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 inline mr-1" />
          {saving ? "Saving…" : "Save Workout"}
        </Button>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </Container>
  );
}
