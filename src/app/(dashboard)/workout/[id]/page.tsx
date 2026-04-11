"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { workoutApi } from "@/lib/api";
import type { WorkoutWithExercises } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";
import { ExerciseProgress } from "@/components/workout/ExerciseProgress";
import { Pencil, Trash2, Dumbbell } from "lucide-react";

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    workoutApi
      .getById(params.id)
      .then(setWorkout)
      .catch(() => setWorkout(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleDelete() {
    try {
      setDeleting(true);
      await workoutApi.delete(params.id);
      router.back();
    } catch {
      setToast("Failed to delete workout");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Workout" backHref="/" />
        <div className="px-4 md:px-6 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-xl p-4 animate-pulse h-24 border border-primary" />)}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div>
        <PageHeader title="Workout" backHref="/" />
        <div className="px-4 md:px-6 text-center py-16">
          <p className="text-muted">Workout not found</p>
        </div>
      </div>
    );
  }

  const workoutDate = format(parseISO(workout.date), "EEEE, MMM d, yyyy");

  return (
    <div>
      <PageHeader
        title={workout.title || "Workout"}
        subtitle={workoutDate}
        backHref="/"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push(`/workout/${params.id}/edit`)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} />
            </Button>
          </div>
        }
      />

      <div className="px-4 md:px-6 space-y-3">
        {workout.workout_exercises.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell size={40} className="text-muted mx-auto mb-3" />
            <p className="text-muted">No exercises logged</p>
            <Button className="mt-4" size="sm" onClick={() => router.push(`/workout/${params.id}/edit`)}>
              Add Exercises
            </Button>
          </div>
        ) : (
          workout.workout_exercises.map((we) => {
            const maxWeight = Math.max(...(we.sets || []).map((s) => s.weight), 0);
            return (
              <Card key={we.id}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary">{we.exercise?.name ?? "Unknown"}</h3>
                  <Badge variant="muted">{(we.sets || []).length} sets</Badge>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  {(we.sets || []).map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 text-sm py-0.5">
                      <span className="text-xs text-muted w-6 text-center font-medium">{i + 1}</span>
                      <span className="text-primary">{s.reps} reps</span>
                      <span className="text-muted">x</span>
                      <span className="text-primary font-medium">{s.weight} kg</span>
                    </div>
                  ))}
                </div>

                {/* Progression */}
                <div className="mt-2 pt-2 border-t border-primary">
                  <ExerciseProgress
                    exerciseName={we.exercise?.name ?? ""}
                    currentWorkoutDate={workout.date}
                    currentMaxWeight={maxWeight}
                  />
                </div>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Workout"
        message="This will permanently delete this workout and all its data."
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast && <Toast message={toast} type="error" onClose={() => setToast(null)} />}
    </div>
  );
}
