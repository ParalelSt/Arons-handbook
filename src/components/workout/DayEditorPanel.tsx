"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExercisePickerModal } from "@/components/workout/ExercisePickerModal";
import { DayImportModal, type ImportedDay } from "@/components/workout/DayImportModal";
import type { FormExercise, FormSet } from "@/types";
import { Plus, Minus, Trash2, GripVertical, ArrowUp, ArrowDown, Download } from "lucide-react";

interface DayEditorPanelProps {
  exercises: FormExercise[];
  onChange: (exercises: FormExercise[]) => void;
  showImportDay?: boolean;
}

function makeExercise(name: string, sets: FormSet[]): FormExercise {
  return { clientId: crypto.randomUUID(), name, sets };
}

export function DayEditorPanel({ exercises, onChange, showImportDay = true }: DayEditorPanelProps) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showDayImport, setShowDayImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportedDay | null>(null);
  const dragFrom = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  function addFromPicker(picked: { name: string; default_reps: number; default_weight: number }) {
    onChange([...exercises, makeExercise(picked.name, [{ reps: picked.default_reps, weight: picked.default_weight }])]);
  }

  function addBlank() {
    onChange([...exercises, makeExercise("", [{ reps: 10, weight: 0 }])]);
  }

  function removeExercise(index: number) {
    onChange(exercises.filter((_, i) => i !== index));
    setDeleteConfirm(null);
  }

  function updateName(index: number, name: string) {
    onChange(exercises.map((ex, i) => (i === index ? { ...ex, name } : ex)));
  }

  function moveExercise(from: number, to: number) {
    if (to < 0 || to >= exercises.length) return;
    const updated = [...exercises];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  }

  function handleDragStart(index: number) { dragFrom.current = index; }
  function handleDragOver(e: React.DragEvent, index: number) { e.preventDefault(); dragOver.current = index; }
  function handleDrop() {
    const from = dragFrom.current, to = dragOver.current;
    if (from !== null && to !== null && from !== to) moveExercise(from, to);
    dragFrom.current = null; dragOver.current = null;
  }

  function addSet(exIndex: number) {
    const ex = exercises[exIndex];
    const last = ex.sets[ex.sets.length - 1];
    onChange(exercises.map((e, i) => i === exIndex ? { ...e, sets: [...e.sets, { reps: last?.reps ?? 10, weight: last?.weight ?? 0 }] } : e));
  }

  function removeSet(exIndex: number, setIndex: number) {
    onChange(exercises.map((e, i) => i !== exIndex ? e : { ...e, sets: e.sets.filter((_, si) => si !== setIndex) }));
  }

  function updateSet(exIndex: number, setIndex: number, field: "reps" | "weight", value: number) {
    onChange(exercises.map((e, i) => {
      if (i !== exIndex) return e;
      return { ...e, sets: e.sets.map((s, si) => si === setIndex ? { ...s, [field]: value } : s) };
    }));
  }

  function moveSet(exIndex: number, from: number, to: number) {
    const ex = exercises[exIndex];
    if (to < 0 || to >= ex.sets.length) return;
    const sets = [...ex.sets];
    const [moved] = sets.splice(from, 1);
    sets.splice(to, 0, moved);
    onChange(exercises.map((e, i) => i === exIndex ? { ...e, sets } : e));
  }

  function handleDayImportRequest(imported: ImportedDay) {
    setPendingImport(imported);
  }

  function confirmDayImport() {
    if (!pendingImport) return;
    const newExercises: FormExercise[] = pendingImport.exercises.map((ex) =>
      makeExercise(ex.name, ex.sets.map((s) => ({ reps: s.reps, weight: s.weight }))),
    );
    onChange([...exercises, ...newExercises]);
    setPendingImport(null);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1.5 mb-3 flex-wrap">
        {showImportDay && (
          <button onClick={() => setShowDayImport(true)} className="p-1.5 text-muted hover:text-success hover:bg-success-surface rounded-lg transition-colors" title="Import existing day">
            <Download className="w-4 h-4" />
          </button>
        )}
        <Button variant="secondary" size="sm" onClick={() => setShowExercisePicker(true)}>
          <Plus className="w-3 h-3" /> Library
        </Button>
        <Button variant="secondary" size="sm" onClick={addBlank}>
          <Plus className="w-3 h-3" /> New
        </Button>
      </div>

      {/* Empty */}
      {exercises.length === 0 && (
        <div className="text-center py-6 border border-dashed border-primary rounded-lg">
          <p className="text-muted text-sm mb-3">No exercises yet</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => setShowExercisePicker(true)}>From Library</Button>
            {showImportDay && <Button variant="secondary" size="sm" onClick={() => setShowDayImport(true)}>Import Day</Button>}
            <Button variant="secondary" size="sm" onClick={addBlank}>Create New</Button>
          </div>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-3" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {exercises.map((ex, exIndex) => (
          <div key={ex.clientId} draggable onDragStart={() => handleDragStart(exIndex)} onDragOver={(e) => handleDragOver(e, exIndex)} className="bg-card rounded-xl p-3 border border-primary">
            <div className="flex items-center gap-2 mb-3">
              <div className="cursor-grab active:cursor-grabbing touch-none shrink-0"><GripVertical className="w-4 h-4 text-muted" /></div>
              <input value={ex.name} onChange={(e) => updateName(exIndex, e.target.value)} placeholder="Exercise name" className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none focus:border-2" style={{ focusBorderColor: 'var(--border-focus)' } as React.CSSProperties} />
              <div className="flex flex-col shrink-0">
                <button onClick={() => moveExercise(exIndex, exIndex - 1)} disabled={exIndex === 0} className="p-1 text-muted hover:text-primary disabled:opacity-25 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => moveExercise(exIndex, exIndex + 1)} disabled={exIndex === exercises.length - 1} className="p-1 text-muted hover:text-primary disabled:opacity-25 transition-colors"><ArrowDown className="w-4 h-4" /></button>
              </div>
              <button onClick={() => setDeleteConfirm(exIndex)} className="p-1.5 text-danger hover:bg-danger-surface rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>

            {ex.sets.length > 0 && (
              <div className="mb-2">
                <div className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 text-xs text-muted mb-1.5 px-1">
                  <span className="w-8" /><span className="w-6 text-center">Set</span><span>Reps</span><span>Weight (kg)</span><span className="w-6" />
                </div>
                {ex.sets.map((s, si) => (
                  <div key={si} className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 items-center mb-1.5">
                    <div className="flex flex-col">
                      <button onClick={() => moveSet(exIndex, si, si - 1)} disabled={si === 0} className="p-0.5 text-muted hover:text-primary disabled:opacity-25 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveSet(exIndex, si, si + 1)} disabled={si === ex.sets.length - 1} className="p-0.5 text-muted hover:text-primary disabled:opacity-25 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                    </div>
                    <span className="text-muted text-xs w-6 text-center">{si + 1}</span>
                    {/* Reps with +/- */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSet(exIndex, si, "reps", Math.max(1, s.reps - 1))} className="p-1 rounded bg-elevated border border-primary text-muted hover:text-primary transition-colors shrink-0"><Minus className="w-3.5 h-3.5" /></button>
                      <input type="number" value={s.reps || ""} onChange={(e) => updateSet(exIndex, si, "reps", parseInt(e.target.value) || 0)} min={1} className="w-full px-2 py-1.5 rounded bg-elevated border border-primary text-primary text-sm text-center focus:outline-none focus:ring-1" />
                      <button onClick={() => updateSet(exIndex, si, "reps", s.reps + 1)} className="p-1 rounded bg-elevated border border-primary text-muted hover:text-primary transition-colors shrink-0"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    {/* Weight with +/- */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSet(exIndex, si, "weight", Math.max(0, s.weight - 2.5))} className="p-1 rounded bg-elevated border border-primary text-muted hover:text-primary transition-colors shrink-0"><Minus className="w-3.5 h-3.5" /></button>
                      <input type="number" value={s.weight || ""} onChange={(e) => updateSet(exIndex, si, "weight", parseFloat(e.target.value) || 0)} min={0} step={0.5} className="w-full px-2 py-1.5 rounded bg-elevated border border-primary text-primary text-sm text-center focus:outline-none focus:ring-1" />
                      <button onClick={() => updateSet(exIndex, si, "weight", s.weight + 2.5)} className="p-1 rounded bg-elevated border border-primary text-muted hover:text-primary transition-colors shrink-0"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => removeSet(exIndex, si)} className="p-1 text-muted hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => addSet(exIndex)} className="text-xs text-accent hover:text-primary transition-colors mt-1" style={{ color: 'var(--accent-primary)' }}>+ Add Set</button>
          </div>
        ))}
      </div>

      {/* Modals */}
      <ExercisePickerModal isOpen={showExercisePicker} onClose={() => setShowExercisePicker(false)} onSelect={(picked) => { addFromPicker(picked); setShowExercisePicker(false); }} existingNames={exercises.map((e) => e.name)} />
      {showImportDay && <DayImportModal isOpen={showDayImport} onClose={() => setShowDayImport(false)} onImport={handleDayImportRequest} />}
      <ConfirmDialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} onConfirm={() => { if (deleteConfirm !== null) removeExercise(deleteConfirm); }} title="Remove Exercise" message={deleteConfirm !== null ? `Remove "${exercises[deleteConfirm]?.name || "this exercise"}"?` : ""} confirmLabel="Remove" />
      <ConfirmDialog open={pendingImport !== null} onClose={() => setPendingImport(null)} onConfirm={confirmDayImport} title="Import Day" message={`Import ${pendingImport?.exercises.length ?? 0} exercises? This will add them to your current list and cannot be easily undone.`} confirmLabel="Import" />
    </div>
  );
}
