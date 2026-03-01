import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Input } from "@/components/ui/Form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Toast } from "@/components/ui/Toast";
import { exerciseApi, goalApi } from "@/lib/api";
import type { Exercise, ExerciseGoal } from "@/types";
import { Trash2, Save } from "lucide-react";

type GoalDraft = Partial<ExerciseGoal> & { exercise_id: string };

export function GoalsScreen() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [goals, setGoals] = useState<Record<string, GoalDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [exs, gls] = await Promise.all([
        exerciseApi.getAll(),
        goalApi.getAll(),
      ]);

      setExercises(exs);

      // Map goals by exercise_id for easy lookup
      const goalsMap: Record<string, GoalDraft> = {};
      gls.forEach((goal) => {
        goalsMap[goal.exercise_id] = goal;
      });
      setGoals(goalsMap);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }

  function updateGoal(
    exerciseId: string,
    field: "reps" | "weight",
    value: string
  ) {
    const numValue =
      field === "reps"
        ? parseInt(value) || undefined
        : parseFloat(value) || undefined;

    setGoals((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] ?? { exercise_id: exerciseId }),
        [field === "reps" ? "target_reps" : "target_weight"]: numValue,
        exercise_id: exerciseId,
      },
    }));

    setEdited((prev) => new Set([...prev, exerciseId]));
  }

  async function saveGoals() {
    try {
      setSaving(true);
      setError("");

      const savePromises = Array.from(edited).map((exerciseId) => {
        const goal = goals[exerciseId];
        return goalApi.upsert(
          exerciseId,
          goal?.target_reps,
          goal?.target_weight
        );
      });

      await Promise.all(savePromises);

      setEdited(new Set());
      setSuccess("Goals saved successfully!");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal() {
    if (!deleteConfirm) return;

    try {
      setError("");
      await goalApi.delete(deleteConfirm);

      const newGoals = { ...goals };
      delete newGoals[deleteConfirm];
      setGoals(newGoals);

      const newEdited = new Set(edited);
      newEdited.delete(deleteConfirm);
      setEdited(newEdited);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
      setDeleteConfirm(null);
    }
  }

  if (loading) {
    return (
      <Container>
        <Header title="Loading..." onBack={() => navigate("/")} />
        <div className="text-center py-12">
          <div className="text-muted">Loading goals...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header
        title="Exercise Goals"
        onBack={() => navigate("/")}
        action={
          edited.size > 0 ? (
            <Button onClick={saveGoals} disabled={saving}>
              <Save className="w-4 h-4" />
            </Button>
          ) : null
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Goals" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}
        {success && (
          <Toast message={success} onDismiss={() => setSuccess("")} />
        )}

        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted mb-4">No exercises yet</p>
            <Button onClick={() => navigate("/exercises")}>
              Create Exercises First
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-primary">Your Goals</h2>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddModal(true)}
                >
                  + Add Goal
                </Button>
              </div>
            </div>

            {Object.keys(goals).length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted mb-3">No goals yet.</p>
                <Button onClick={() => setShowAddModal(true)}>
                  Add Your First Goal
                </Button>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {Object.keys(goals)
                  .map((id) => ({
                    id,
                    exercise: exercises.find((e) => e.id === id),
                    goal: goals[id],
                  }))
                  .filter((item) => item.exercise)
                  .sort((a, b) =>
                    a.exercise!.name.localeCompare(b.exercise!.name)
                  )
                  .map(({ id, exercise, goal }) => (
                    <Card key={id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-primary truncate">
                          {exercise?.name}
                        </h3>
                        <button
                          onClick={() => setDeleteConfirm(id)}
                          className="p-2 hover:bg-elevated rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-muted" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Target Reps"
                          type="number"
                          value={
                            goal?.target_reps ? String(goal.target_reps) : ""
                          }
                          onChange={(v) => updateGoal(id, "reps", v)}
                          placeholder="e.g., 12"
                          min={0}
                        />
                        <Input
                          label="Target Weight (kg)"
                          type="number"
                          value={
                            goal?.target_weight
                              ? String(goal.target_weight)
                              : ""
                          }
                          onChange={(v) => updateGoal(id, "weight", v)}
                          placeholder="e.g., 50"
                          min={0}
                          step={0.5}
                        />
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {exercises.length > 0 && edited.size > 0 && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => {
                setEdited(new Set());
                loadData();
              }}
              variant="secondary"
              className="flex-1"
            >
              Discard Changes
            </Button>
            <Button onClick={saveGoals} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Goals"}
            </Button>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-floating rounded-2xl border border-primary max-w-lg w-[95%] sm:w-full max-h-[80vh] overflow-y-auto mx-auto my-auto p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">Add Goal</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-elevated rounded-lg transition-colors"
              >
                <span className="text-muted">✕</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs sm:text-sm font-medium text-secondary">
                  Search exercises
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to search"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-elevated border border-primary text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-(--border-focus)"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {exercises
                  .filter((ex) => !goals[ex.id])
                  .filter((ex) =>
                    ex.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => {
                        setGoals((prev) => ({
                          ...prev,
                          [exercise.id]: { exercise_id: exercise.id },
                        }));
                        setEdited((prev) => new Set([...prev, exercise.id]));
                        setShowAddModal(false);
                        setSearch("");
                      }}
                      className="w-full text-left p-3 rounded-lg bg-elevated hover:bg-surface border border-primary hover:border-secondary transition-all"
                    >
                      <p className="text-primary font-medium">{exercise.name}</p>
                    </button>
                  ))}

                {exercises
                  .filter((ex) => !goals[ex.id])
                  .filter((ex) =>
                    ex.name.toLowerCase().includes(search.toLowerCase())
                  ).length === 0 && (
                  <p className="text-muted text-sm text-center py-6">
                    No exercises available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Goal"
        message={`Are you sure you want to delete this goal? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={deleteGoal}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Container>
  );
}
