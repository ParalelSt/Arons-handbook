import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { workoutApi } from "@/lib/api";
import { ExerciseProgress } from "@/components/ui/ExerciseProgress";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import type { WorkoutWithExercises } from "@/types";
import { format, parseISO } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";

export function WorkoutDetailScreen() {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }

    async function loadWorkout() {
      try {
        setLoading(true);
        setError("");
        const data = await workoutApi.getById(workoutId!);
        setWorkout(data);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load workout";
        console.error(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
  }, [workoutId]);

  async function handleDelete() {
    if (!workoutId) return;

    try {
      setError("");
      await workoutApi.delete(workoutId);
      navigate(-1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete workout";
      console.error(err);
      setError(msg);
    } finally {
      setDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <Header title="Workout" onBack={() => navigate(-1)} />
        <div className="container mx-auto px-4 py-6">
          <SkeletonList count={3} lines={4} />
        </div>
      </Container>
    );
  }

  if (!workout) {
    return (
      <Container>
        <Header title="Not Found" onBack={() => navigate(-1)} />
        <div className="text-center py-12">
          <p className="text-secondary mb-4">Workout not found</p>
          <button
            onClick={() => navigate(-1)}
            className="text-accent hover:text-primary text-sm transition-colors"
          >
            Go back
          </button>
        </div>
      </Container>
    );
  }

  const workoutDate = parseISO(workout.date);
  const headerTitle = `${format(workoutDate, "EEEE")}${
    workout.title ? ` – ${workout.title}` : ""
  }`;

  return (
    <Container>
      <Header
        title={headerTitle}
        onBack={() => navigate(-1)}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/workout/${workoutId}/edit`)}
              aria-label="Edit workout"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteConfirm(true)}
              aria-label="Delete workout"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Workout" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* Date and notes */}
        <div className="mb-4 sm:mb-6">
          <p className="text-secondary text-xs sm:text-sm mb-2">
            {format(workoutDate, "MMMM d, yyyy")}
          </p>
          {workout.notes && (
            <Card className="p-3 sm:p-4">
              <p className="text-secondary text-sm">{workout.notes}</p>
            </Card>
          )}
        </div>

        {/* Exercises list */}
        <div className="space-y-3 sm:space-y-4">
          {workout.workout_exercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary mb-4">No exercises logged yet</p>
              <Button
                onClick={() => navigate(`/workout/${workoutId}/edit`)}
              >
                Add Exercise
              </Button>
            </div>
          ) : (
            <>
              {workout.workout_exercises.map((workoutExercise) => (
                <Card key={workoutExercise.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-primary mb-1 truncate">
                        {workoutExercise.exercise?.name || "Unknown Exercise"}
                      </h3>
                      {workoutExercise.notes && (
                        <p className="text-secondary text-sm">
                          {workoutExercise.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    {workoutExercise.sets && workoutExercise.sets.length > 0 ? (
                      workoutExercise.sets.map((set, setIndex) => (
                        <div
                          key={set.id}
                          className="flex items-center gap-2 bg-elevated rounded-lg p-2 sm:p-3"
                        >
                          <span className="text-muted font-medium w-12 text-xs sm:text-sm shrink-0">
                            Set {setIndex + 1}
                          </span>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-primary font-semibold text-sm sm:text-base">
                                {set.reps}
                              </span>
                              <span className="text-secondary text-xs">
                                reps
                              </span>
                            </div>
                            <span className="text-muted text-xs">×</span>
                            <div className="flex items-center gap-1">
                              <span className="text-primary font-semibold text-sm sm:text-base">
                                {set.weight}
                              </span>
                              <span className="text-secondary text-xs">
                                kg
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted text-sm italic">
                        No sets logged
                      </p>
                    )}
                  </div>

                  {/* Exercise Progress Comparison */}
                  {workoutExercise.exercise?.name && workout && (
                    <ExerciseProgress
                      exerciseName={workoutExercise.exercise.name}
                      currentWorkoutId={workout.id}
                      currentMaxWeight={Math.max(
                        ...(workoutExercise.sets || []).map((s) => s.weight),
                        0,
                      )}
                    />
                  )}
                </Card>
              ))}

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Done
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
      />
    </Container>
  );
}
