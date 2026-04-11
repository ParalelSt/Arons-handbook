"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { workoutApi, workoutExerciseApi } from "@/lib/api";
import type { WorkoutWithExercises, FormExercise } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { DayEditorPanel } from "@/components/workout/DayEditorPanel";
import { Save } from "lucide-react";

export default function EditWorkoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [exercises, setExercises] = useState<FormExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    workoutApi
      .getById(params.id)
      .then((w) => {
        setWorkout(w);
        setExercises(
          w.workout_exercises.map((we) => ({
            clientId: crypto.randomUUID(),
            name: we.exercise?.name ?? "",
            sets: (we.sets || []).map((s) => ({ reps: s.reps, weight: s.weight })),
            workoutExerciseId: we.id,
          } as FormExercise & { workoutExerciseId?: string })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSave() {
    const valid = exercises.filter((ex) => ex.name.trim());
    if (valid.length === 0) {
      setToast({ msg: "Add at least one exercise", type: "error" });
      return;
    }

    try {
      setSaving(true);
      await workoutExerciseApi.saveAll(
        params.id,
        valid.map((ex) => ({
          clientId: ex.clientId,
          name: ex.name,
          sets: ex.sets,
          workoutExerciseId: (ex as FormExercise & { workoutExerciseId?: string }).workoutExerciseId,
        })),
      );
      setToast({ msg: "Workout saved!", type: "success" });
      setTimeout(() => router.push(`/workout/${params.id}`), 500);
    } catch {
      setToast({ msg: "Failed to save", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Workout" backHref={`/workout/${params.id}`} />
        <div className="px-4 md:px-6"><div className="bg-card rounded-xl h-48 animate-pulse border border-primary" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit: ${workout?.title || "Workout"}`}
        backHref={`/workout/${params.id}`}
        action={
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} /> Save
          </Button>
        }
      />

      <div className="px-4 md:px-6">
        <DayEditorPanel exercises={exercises} onChange={setExercises} />
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
