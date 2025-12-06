import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { workoutApi } from "@/lib/api";
import type { WorkoutWithExercises } from "@/types";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

export function WorkoutDetailScreen() {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }

    async function loadWorkout() {
      try {
        setLoading(true);
        setError("");
        const data = await workoutApi.getById(workoutId!);
        console.log("Loaded workout:", data); // Debug log
        setWorkout(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load workout");
      } finally {
        setLoading(false);
      }
    }
  }, [workoutId]);

  async function handleDelete() {
    if (!workoutId || !confirm("Delete this workout?")) return;

    try {
      setError("");
      await workoutApi.delete(workoutId);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete workout");
    }
  }

  if (loading) {
    return (
      <Container>
        <Header title="Loading..." onBack={() => navigate(-1)} />
        <div className="text-center py-12">
          <div className="text-slate-400">Loading workout...</div>
        </div>
      </Container>
    );
  }

  if (!workout) {
    return (
      <Container>
        <Header title="Not Found" onBack={() => navigate(-1)} />
        <div className="text-center py-12">
          <div className="text-slate-400">Workout not found</div>
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
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && <ErrorMessage message={error} onDismiss={() => setError("")} />}

        {/* Date and notes */}
        <div className="mb-4 sm:mb-6">
          <p className="text-slate-400 text-xs sm:text-sm mb-2">
            {format(workoutDate, "MMMM d, yyyy")}
          </p>
          {workout.notes && (
            <Card className="p-3 sm:p-4">
              <p className="text-slate-300 text-sm">{workout.notes}</p>
            </Card>
          )}
        </div>

        {/* Exercises list */}
        <div className="space-y-3 sm:space-y-4">
          {workout.workout_exercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No exercises logged yet</p>
              <Button
                onClick={() => navigate(`/workout/${workoutId}/add-exercise`)}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Exercise
              </Button>
            </div>
          ) : (
            <>
              {workout.workout_exercises.map((workoutExercise) => (
                <Card key={workoutExercise.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                        {workoutExercise.exercise?.name || "Unknown Exercise"}
                      </h3>
                      {workoutExercise.notes && (
                        <p className="text-slate-400 text-sm">
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
                          className="flex items-center gap-2 sm:gap-4 bg-slate-900/50 rounded-lg p-2 sm:p-3"
                        >
                          <span className="text-slate-500 font-medium w-10 sm:w-12 text-sm sm:text-base">
                            Set {setIndex + 1}
                          </span>
                          <div className="flex-1 flex items-center gap-2 sm:gap-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-white font-semibold text-base sm:text-lg">
                                {set.reps}
                              </span>
                              <span className="text-slate-400 text-xs sm:text-sm">
                                reps
                              </span>
                            </div>
                            <span className="text-slate-600 hidden sm:inline">
                              @
                            </span>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-white font-semibold text-base sm:text-lg">
                                {set.weight}
                              </span>
                              <span className="text-slate-400 text-xs sm:text-sm">
                                kg
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm italic">
                        No sets logged
                      </p>
                    )}
                  </div>
                </Card>
              ))}

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/workout/${workoutId}/add-exercise`)}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Another Exercise
              </Button>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
