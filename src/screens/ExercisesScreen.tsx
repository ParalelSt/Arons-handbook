import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Input, Modal } from "@/components/ui/Form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { exerciseApi } from "@/lib/api";
import type { Exercise } from "@/types";
import { Trash2, Edit2, Dumbbell } from "lucide-react";

export function ExercisesScreen() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      setLoading(true);
      setError("");
      const data = await exerciseApi.getAll();
      setExercises(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load exercises";
      console.error(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!deleteConfirm) return;

    try {
      setError("");
      await exerciseApi.delete(id);
      setDeleteConfirm(null);
      loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete exercise";
      console.error(err);
      setError(msg);
      setDeleteConfirm(null);
    }
  }

  function handleEditClick(exercise: Exercise) {
    setEditingExercise(exercise);
    setEditName(exercise.name);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExercise || !editName.trim()) return;

    try {
      setSaving(true);
      setError("");
      await exerciseApi.update(editingExercise.id, editName.trim());
      setEditingExercise(null);
      setEditName("");
      loadExercises();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rename exercise";
      console.error(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <Header
        title="Exercises"
        onBack={() => navigate("/templates")}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-secondary">Loading exercises...</div>
          </div>
        )}

        {!loading && exercises.length === 0 && (
          <div className="text-center py-16 px-4">
            <Dumbbell className="w-12 h-12 text-muted mx-auto mb-4" />
            <h2 className="text-xl text-primary mb-2">No Exercises Yet</h2>
            <p className="text-secondary mb-6 max-w-sm mx-auto">
              Exercises are automatically added here when you save them in a
              weekly template. Head to Templates to build your plan.
            </p>
            <Button onClick={() => navigate("/templates")}>
              Go to Templates
            </Button>
          </div>
        )}

        {!loading && exercises.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted px-1 mb-3">
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} —
              synced from your weekly templates
            </p>
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-medium">
                    {exercise.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(exercise)}
                      className="p-2 hover:bg-elevated rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-accent" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          id: exercise.id,
                          name: exercise.name,
                        })
                      }
                      className="p-2 hover:bg-elevated rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editingExercise}
        onClose={() => {
          setEditingExercise(null);
          setEditName("");
        }}
        title="Rename Exercise"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            label="Exercise Name"
            value={editName}
            onChange={setEditName}
            placeholder="e.g., Bench Press"
            required
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingExercise(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !editName.trim()}
              className="flex-1"
            >
              {saving ? "Saving..." : "Rename"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Container>
  );
}
