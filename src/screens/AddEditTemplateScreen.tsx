import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Input, TextArea, Modal } from "@/components/ui/Form";
import { templateApi } from "@/lib/templates";
import { exerciseApi } from "@/lib/api";
import type { Exercise, CreateTemplateExerciseInput } from "@/types";
import { Plus, X } from "lucide-react";

const DRAFT_KEY = 'template-draft';

export function AddEditTemplateScreen() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const isEditing = !!templateId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<CreateTemplateExerciseInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);

  // Load draft on mount
  useEffect(() => {
    loadExercises();
    if (isEditing) {
      loadTemplate();
    } else {
      // Load draft only for new templates
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setName(parsed.name || "");
          setDescription(parsed.description || "");
          setExercises(parsed.exercises || []);
        } catch (err) {
          console.error("Failed to load draft:", err);
        }
      }
    }
  }, []);

  // Auto-save draft whenever data changes (only for new templates)
  useEffect(() => {
    if (!isEditing && (name || description || exercises.length > 0)) {
      const draft = { name, description, exercises };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [name, description, exercises, isEditing]);

  async function loadExercises() {
    try {
      const data = await exerciseApi.getAll();
      setAvailableExercises(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTemplate() {
    if (!templateId) return;

    try {
      setLoading(true);
      const template = await templateApi.getById(templateId);
      setName(template.name);
      setDescription(template.description || "");
      setExercises(
        template.template_exercises.map((te) => ({
          exercise_id: te.exercise_id,
          target_sets: te.target_sets,
          target_reps: te.target_reps || undefined,
          target_weight: te.target_weight || undefined,
          notes: te.notes || undefined,
        }))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to load template");
      navigate("/templates");
    } finally {
      setLoading(false);
    }
  }

  function addExercise(exercise: Exercise) {
    setExercises([
      ...exercises,
      {
        exercise_id: exercise.id,
        target_sets: 3,
        target_reps: undefined,
        target_weight: undefined,
        notes: undefined,
      },
    ]);
    setShowExerciseModal(false);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function updateExercise(
    index: number,
    updates: Partial<CreateTemplateExerciseInput>
  ) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], ...updates };
    setExercises(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (exercises.length === 0) {
      alert("Please add at least one exercise");
      return;
    }

    try {
      setSaving(true);
      if (isEditing && templateId) {
        // Delete and recreate template exercises for simplicity
        await templateApi.update(templateId, {
          name,
          description: description || undefined,
        });
        // Note: In production, you'd want more sophisticated update logic
        alert(
          "Template updated! (Note: Exercise updates require deleting and recreating)"
        );
      } else {
        await templateApi.create({
          name,
          description: description || undefined,
          exercises,
        });
        // Clear draft after successful save
        localStorage.removeItem(DRAFT_KEY);
      }
      navigate("/templates");
    } catch (err) {
      console.error(err);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  function getExerciseName(exerciseId: string): string {
    return (
      availableExercises.find((e) => e.id === exerciseId)?.name || "Unknown"
    );
  }

  if (loading) {
    return (
      <Container>
        <Header title="Loading..." onBack={() => navigate("/templates")} />
        <div className="text-center py-12">
          <div className="text-slate-400">Loading template...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header
        title={isEditing ? "Edit Template" : "New Template"}
        onBack={() => navigate("/templates")}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Card className="p-5 space-y-4">
            <Input
              label="Template Name"
              value={name}
              onChange={setName}
              placeholder="e.g., Push Day, Leg Day"
              required
            />
            <TextArea
              label="Description (Optional)"
              value={description}
              onChange={setDescription}
              placeholder="Notes about this workout routine..."
            />
          </Card>

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
                  Add First Exercise
                </Button>
              </Card>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {exercises.map((exercise, index) => (
                  <Card key={index} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                        {getExerciseName(exercise.exercise_id)}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <Input
                        label="Target Sets"
                        type="number"
                        value={exercise.target_sets}
                        onChange={(v) =>
                          updateExercise(index, {
                            target_sets: parseInt(v) || 0,
                          })
                        }
                        min={1}
                        required
                      />
                      <Input
                        label="Target Reps"
                        type="number"
                        value={exercise.target_reps || ""}
                        onChange={(v) =>
                          updateExercise(index, {
                            target_reps: v ? parseInt(v) : undefined,
                          })
                        }
                        placeholder="Optional"
                        min={0}
                      />
                      <Input
                        label="Target Weight"
                        type="number"
                        value={exercise.target_weight || ""}
                        onChange={(v) =>
                          updateExercise(index, {
                            target_weight: v ? parseFloat(v) : undefined,
                          })
                        }
                        placeholder="kg"
                        min={0}
                        step={0.5}
                      />
                    </div>

                    <TextArea
                      label="Notes (Optional)"
                      value={exercise.notes || ""}
                      onChange={(v) =>
                        updateExercise(index, { notes: v || undefined })
                      }
                      placeholder="Notes for this exercise..."
                      rows={2}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/templates")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || exercises.length === 0}
              className="flex-1"
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Update Template"
                : "Create Template"}
            </Button>
          </div>

          {!isEditing && (name || description || exercises.length > 0) && (
            <p className="text-xs text-slate-500 text-center">
              Draft saved automatically
            </p>
          )}
        </form>
      </div>

      <Modal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="Select Exercise"
      >
        {availableExercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No exercises available</p>
            <Button onClick={() => navigate("/exercises")}>
              Create Exercises First
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
