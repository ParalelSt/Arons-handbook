import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Input, TextArea, Modal } from "@/components/ui/Form";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { workoutApi, exerciseApi } from "@/lib/api";
import type { Exercise, CreateWorkoutExerciseInput } from "@/types";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

const DRAFT_KEY = "workout-draft";

export function AddWorkoutScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetDate = searchParams.get("date");

  const [date, setDate] = useState(
    presetDate || format(new Date(), "yyyy-MM-dd")
  );
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<CreateWorkoutExerciseInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

  // Load draft on mount
  useEffect(() => {
    loadExercises();
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft && !presetDate) {
      try {
        const parsed = JSON.parse(draft);
        setDate(parsed.date || format(new Date(), "yyyy-MM-dd"));
        setTitle(parsed.title || "");
        setNotes(parsed.notes || "");
        setExercises(parsed.exercises || []);
      } catch (err) {
        console.error("Failed to load draft:", err);
      }
    }
  }, []);

  // Auto-save draft whenever data changes
  useEffect(() => {
    if (title || notes || exercises.length > 0) {
      const draft = { date, title, notes, exercises };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [date, title, notes, exercises]);

  async function loadExercises() {
    try {
      const data = await exerciseApi.getAll();
      setAvailableExercises(data);
    } catch (err) {
      console.error(err);
    }
  }

  function addExercise(exercise: Exercise) {
    setExercises([
      ...exercises,
      {
        exercise_id: exercise.id,
        sets: [{ reps: 0, weight: 0 }],
        notes: "",
      },
    ]);
    setShowExerciseModal(false);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExerciseNotes(index: number, notes: string) {
    const updated = [...exercises];
    updated[index].notes = notes;
    setExercises(updated);
  }

  function addSet(exerciseIndex: number) {
    const updated = [...exercises];
    updated[exerciseIndex].sets.push({ reps: 0, weight: 0 });
    setExercises(updated);
  }

  function updateSet(
    exerciseIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: string
  ) {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = parseFloat(value) || 0;
    setExercises(updated);
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    const updated = [...exercises];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    );
    setExercises(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (exercises.length === 0) {
      setError("Please add at least one exercise");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await workoutApi.create({
        date,
        title: title || undefined,
        notes: notes || undefined,
        exercises,
      });
      // Clear draft after successful save
      localStorage.removeItem(DRAFT_KEY);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  function getExerciseName(exerciseId: string): string {
    return (
      availableExercises.find((e) => e.id === exerciseId)?.name || "Unknown"
    );
  }

  return (
    <Container>
      <Header title="New Workout" onBack={() => navigate(-1)} />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Info */}
          <Card className="p-5 space-y-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={setDate}
              required
            />
            <Input
              label="Title (Optional)"
              value={title}
              onChange={setTitle}
              placeholder="e.g., Push Day, Leg Day"
            />
            <TextArea
              label="Notes (Optional)"
              value={notes}
              onChange={setNotes}
              placeholder="Any notes about this workout..."
            />
          </Card>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Exercises</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowExerciseModal(true)}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Exercise
              </Button>
            </div>

            {exercises.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-400 mb-4">No exercises added yet</p>
                <Button
                  type="button"
                  onClick={() => setShowExerciseModal(true)}
                >
                  Add Your First Exercise
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, exIndex) => (
                  <Card key={exIndex} className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {getExerciseName(exercise.exercise_id)}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeExercise(exIndex)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {/* Sets */}
                    <div className="space-y-2 mb-4">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm w-12">
                            Set {setIndex + 1}
                          </span>
                          <Input
                            label=""
                            type="number"
                            value={set.reps}
                            onChange={(v) =>
                              updateSet(exIndex, setIndex, "reps", v)
                            }
                            placeholder="Reps"
                            min={0}
                          />
                          <span className="text-slate-500">@</span>
                          <Input
                            label=""
                            type="number"
                            value={set.weight}
                            onChange={(v) =>
                              updateSet(exIndex, setIndex, "weight", v)
                            }
                            placeholder="Weight (kg)"
                            min={0}
                            step={0.5}
                          />
                          <button
                            type="button"
                            onClick={() => removeSet(exIndex, setIndex)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-sm"
                        onClick={() => addSet(exIndex)}
                      >
                        + Add Set
                      </Button>
                    </div>

                    <div className="mt-4">
                      <TextArea
                        label="Notes (Optional)"
                        value={exercise.notes || ""}
                        onChange={(v) => updateExerciseNotes(exIndex, v)}
                        placeholder="Notes for this exercise..."
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || exercises.length === 0}
              className="flex-1"
            >
              {saving ? "Saving..." : "Save Workout"}
            </Button>
          </div>

          {(title || notes || exercises.length > 0) && (
            <p className="text-xs text-slate-500 text-center">
              Draft saved automatically
            </p>
          )}
        </form>
      </div>

      {/* Exercise Selection Modal */}
      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="Select Exercise"
      >
        {availableExercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No exercises available</p>
            <Button onClick={() => navigate("/exercises")}>
              Create Your First Exercise
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {availableExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => addExercise(exercise)}
                className="w-full text-left p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <p className="text-white font-medium">{exercise.name}</p>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </Container>
  );
}
