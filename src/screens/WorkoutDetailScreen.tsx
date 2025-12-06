import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Input } from "@/components/ui/Form";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { workoutApi, setApi } from "@/lib/api";
import type { WorkoutWithExercises } from "@/types";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

export function WorkoutDetailScreen() {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedSets, setEditedSets] = useState<
    Record<string, { reps: number; weight: number }>
  >({});
  const [saving, setSaving] = useState(false);

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

  function startEditing() {
    if (!workout) return;

    // Initialize editedSets with current values
    const sets: Record<string, { reps: number; weight: number }> = {};
    workout.workout_exercises.forEach((we) => {
      we.sets?.forEach((set) => {
        sets[set.id] = { reps: set.reps, weight: set.weight };
      });
    });
    setEditedSets(sets);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditedSets({});
  }

  async function saveEdits() {
    try {
      setSaving(true);
      setError("");

      // Update all modified sets
      const updates = Object.entries(editedSets).map(([setId, values]) =>
        setApi.update(setId, values)
      );

      await Promise.all(updates);

      // Reload workout to show updated values
      if (workoutId) {
        const data = await workoutApi.getById(workoutId);
        setWorkout(data);
      }

      setIsEditing(false);
      setEditedSets({});
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function updateEditedSet(
    setId: string,
    field: "reps" | "weight",
    value: string
  ) {
    const numValue =
      field === "reps" ? parseInt(value) || 0 : parseFloat(value) || 0;
    setEditedSets((prev) => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        [field]: numValue,
      },
    }));
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
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button onClick={saveEdits} disabled={saving}>
                  <Save className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={startEditing}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
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
                          className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-2 sm:p-3"
                        >
                          <span className="text-slate-500 font-medium w-12 text-xs sm:text-sm flex-shrink-0">
                            Set {setIndex + 1}
                          </span>
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                label=""
                                type="number"
                                value={String(
                                  editedSets[set.id]?.reps ?? set.reps
                                )}
                                onChange={(v) =>
                                  updateEditedSet(set.id, "reps", v)
                                }
                                placeholder="Reps"
                                min={0}
                              />
                              <span className="text-slate-500 text-xs">×</span>
                              <Input
                                label=""
                                type="number"
                                value={String(
                                  editedSets[set.id]?.weight ?? set.weight
                                )}
                                onChange={(v) =>
                                  updateEditedSet(set.id, "weight", v)
                                }
                                placeholder="kg"
                                min={0}
                                step={0.5}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-white font-semibold text-sm sm:text-base">
                                  {set.reps}
                                </span>
                                <span className="text-slate-400 text-xs">
                                  reps
                                </span>
                              </div>
                              <span className="text-slate-600 text-xs">×</span>
                              <div className="flex items-center gap-1">
                                <span className="text-white font-semibold text-sm sm:text-base">
                                  {set.weight}
                                </span>
                                <span className="text-slate-400 text-xs">
                                  kg
                                </span>
                              </div>
                            </div>
                          )}
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
                onClick={() => navigate("/")}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
