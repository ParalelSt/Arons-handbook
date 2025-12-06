import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Input, Modal } from "@/components/ui/Form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { exerciseApi } from "@/lib/api";
import type { Exercise } from "@/types";
import { Plus, Trash2, Edit2 } from "lucide-react";

export function ExercisesScreen() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load exercises");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    try {
      setSaving(true);
      setError("");
      await exerciseApi.create(newExerciseName.trim());
      setNewExerciseName("");
      setShowAddModal(false);
      loadExercises();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to add exercise");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!deleteConfirm) return;

    try {
      setError("");
      await exerciseApi.delete(id);
      setDeleteConfirm(null);
      loadExercises();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete exercise");
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to rename exercise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <Header
        title="Exercises"
        onBack={() => navigate("/")}
        action={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading exercises...</div>
          </div>
        )}

        {!loading && exercises.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl text-white mb-2">No Exercises Yet</h2>
            <p className="text-slate-400 mb-6">Create your exercise library</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-5 h-5 inline mr-2" />
              Add Your First Exercise
            </Button>
          </div>
        )}

        {!loading && exercises.length > 0 && (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {exercise.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(exercise)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          id: exercise.id,
                          name: exercise.name,
                        })
                      }
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewExerciseName("");
        }}
        title="Add Exercise"
      >
        <form onSubmit={handleAddExercise} className="space-y-4">
          <Input
            label="Exercise Name"
            value={newExerciseName}
            onChange={setNewExerciseName}
            placeholder="e.g., Bench Press"
            required
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !newExerciseName.trim()}
              className="flex-1"
            >
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>
      </Modal>

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
