import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Input, Modal } from "@/components/ui/Form";
import { exerciseApi } from "@/lib/api";
import type { Exercise } from "@/types";
import { Plus, Trash2 } from "lucide-react";

export function ExercisesScreen() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      setLoading(true);
      const data = await exerciseApi.getAll();
      setExercises(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    try {
      setSaving(true);
      await exerciseApi.create(newExerciseName.trim());
      setNewExerciseName("");
      setShowAddModal(false);
      loadExercises();
    } catch (err) {
      console.error(err);
      alert("Failed to add exercise");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      await exerciseApi.delete(id);
      loadExercises();
    } catch (err) {
      console.error(err);
      alert("Failed to delete exercise");
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
                  <button
                    onClick={() => handleDelete(exercise.id, exercise.name)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
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
    </Container>
  );
}
