"use client";

import { useEffect, useState } from "react";
import {
  getExerciseLibrary,
  createExerciseLibraryItem,
  updateExerciseLibraryItem,
  deleteExerciseLibraryItem,
  sortExerciseLibrary,
  groupByMuscle,
} from "@/lib/exerciseLibraryService";
import type { ExerciseLibraryItem, ExerciseLibrarySortMode } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Dumbbell, Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<ExerciseLibrarySortMode>("alpha");

  // Add/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formMuscle, setFormMuscle] = useState("");
  const [formReps, setFormReps] = useState(10);
  const [formWeight, setFormWeight] = useState(0);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getExerciseLibrary();
      setExercises(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setFormName("");
    setFormMuscle("");
    setFormReps(10);
    setFormWeight(0);
    setShowModal(true);
  }

  function openEdit(item: ExerciseLibraryItem) {
    setEditingId(item.id);
    setFormName(item.name);
    setFormMuscle(item.muscle_group || "");
    setFormReps(item.default_reps);
    setFormWeight(item.default_weight);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    try {
      setSaving(true);
      if (editingId) {
        await updateExerciseLibraryItem(editingId, {
          name: formName,
          muscle_group: formMuscle || null,
          default_reps: formReps,
          default_weight: formWeight,
        });
        setToast({ msg: "Exercise updated!", type: "success" });
      } else {
        await createExerciseLibraryItem(formName, formMuscle || null, formReps, formWeight);
        setToast({ msg: "Exercise added!", type: "success" });
      }
      setShowModal(false);
      loadData();
    } catch {
      setToast({ msg: "Failed to save exercise", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteExerciseLibraryItem(deleteId);
      setDeleteId(null);
      loadData();
      setToast({ msg: "Exercise deleted", type: "success" });
    } catch {
      setToast({ msg: "Failed to delete", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const filtered = search
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.muscle_group?.toLowerCase().includes(search.toLowerCase()),
      )
    : exercises;

  const sorted = sortExerciseLibrary(filtered, sortMode);

  const grouped = sortMode === "muscle" ? groupByMuscle(sorted) : null;

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle={`${exercises.length} exercises`}
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus size={14} /> Add
          </Button>
        }
      />

      <div className="px-4 md:px-6 space-y-4">
        {/* Search + sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none"
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as ExerciseLibrarySortMode)}
            className="px-3 py-2.5 rounded-lg bg-elevated border border-primary text-primary text-sm"
          >
            <option value="alpha">A-Z</option>
            <option value="muscle">Muscle</option>
            <option value="recent">Recent</option>
            <option value="frequent">Most Used</option>
            <option value="created">Newest</option>
          </select>
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl h-16 animate-pulse border border-primary" />
          ))
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title={search ? "No matches" : "No exercises yet"}
            description={search ? "Try a different search term" : "Add exercises to build your library"}
            action={
              !search ? (
                <Button size="sm" onClick={openAdd}>
                  <Plus size={14} /> Add Exercise
                </Button>
              ) : undefined
            }
          />
        ) : grouped ? (
          // Muscle group view
          Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{group}</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <ExerciseRow key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {sorted.map((item) => (
              <ExerciseRow key={item.id} item={item} onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Exercise" : "Add Exercise"} size="sm">
        <div className="space-y-4">
          <Input label="Exercise Name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Bench Press" autoFocus />
          <Input label="Muscle Group (optional)" value={formMuscle} onChange={(e) => setFormMuscle(e.target.value)} placeholder="e.g. Chest" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Default Reps" type="number" value={formReps || ""} onChange={(e) => setFormReps(parseInt(e.target.value) || 0)} min={1} />
            <Input label="Default Weight (kg)" type="number" value={formWeight || ""} onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)} min={0} step={0.5} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!formName.trim()}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Exercise"
        message="This will remove this exercise from your library. Existing workouts won't be affected."
        confirmLabel="Delete"
        loading={deleting}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ExerciseRow({ item, onEdit, onDelete }: { item: ExerciseLibraryItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.muscle_group && <Badge variant="muted">{item.muscle_group}</Badge>}
          <span className="text-xs text-muted">
            {item.default_reps}r × {item.default_weight}kg
          </span>
          {item.usage_count > 0 && <span className="text-xs text-muted">· used {item.usage_count}×</span>}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 size={14} className="text-danger" />
        </Button>
      </div>
    </Card>
  );
}
