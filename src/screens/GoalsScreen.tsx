import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Input } from "@/components/ui/Form";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { exerciseApi, goalApi } from "@/lib/api";
import type { Exercise, ExerciseGoal } from "@/types";
import { Trash2, Save } from "lucide-react";

export function GoalsScreen() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [goals, setGoals] = useState<Record<string, ExerciseGoal>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Set<string>>(new Set());

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
      const goalsMap: Record<string, ExerciseGoal> = {};
      gls.forEach((goal) => {
        goalsMap[goal.exercise_id] = goal;
      });
      setGoals(goalsMap);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load goals");
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
        ...prev[exerciseId],
        [field === "reps" ? "target_reps" : "target_weight"]: numValue,
        exercise_id: exerciseId,
      } as ExerciseGoal,
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
      setError("Goals saved successfully!");
      setTimeout(() => setError(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save goals");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(exerciseId: string) {
    if (!confirm("Delete this goal?")) return;

    try {
      setError("");
      await goalApi.delete(exerciseId);

      const newGoals = { ...goals };
      delete newGoals[exerciseId];
      setGoals(newGoals);

      const newEdited = new Set(edited);
      newEdited.delete(exerciseId);
      setEdited(newEdited);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete goal");
    }
  }

  if (loading) {
    return (
      <Container>
        <Header title="Loading..." onBack={() => navigate("/")} />
        <div className="text-center py-12">
          <div className="text-slate-400">Loading goals...</div>
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

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-400 mb-4">No exercises yet</p>
            <Button onClick={() => navigate("/exercises")}>
              Create Exercises First
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {exercises.map((exercise) => {
              const goal = goals[exercise.id];
              return (
                <Card key={exercise.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                      {exercise.name}
                    </h3>
                    {goal && (
                      <button
                        onClick={() => deleteGoal(exercise.id)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Target Reps"
                      type="number"
                      value={goal?.target_reps ? String(goal.target_reps) : ""}
                      onChange={(v) => updateGoal(exercise.id, "reps", v)}
                      placeholder="e.g., 12"
                      min={0}
                    />
                    <Input
                      label="Target Weight (kg)"
                      type="number"
                      value={goal?.target_weight ? String(goal.target_weight) : ""}
                      onChange={(v) => updateGoal(exercise.id, "weight", v)}
                      placeholder="e.g., 50"
                      min={0}
                      step={0.5}
                    />
                  </div>
                </Card>
              );
            })}
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
    </Container>
  );
}
