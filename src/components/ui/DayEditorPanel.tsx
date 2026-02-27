/**
 * DayEditorPanel
 *
 * Reusable exercise-editing panel for a single day. Used identically in:
 *  - EditWeekTemplateScreen  (template days)
 *  - EditWorkoutDayScreen    (live workout days)
 *
 * Responsibilities:
 *  - Exercise list with drag + up/down reorder
 *  - Per-exercise: name input, set rows, add/remove set, move set up/down
 *  - Header toolbar: Library picker, Import Day, New blank exercise
 *  - ConfirmDialog for exercise deletion
 *  - ExercisePickerModal + DayImportModal (if showImportDay)
 *
 * Strict separation: this component never touches the DB directly.
 * All mutations go through onChange(newExercises).
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Layout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExercisePickerModal } from "@/components/ui/ExercisePickerModal";
import {
  DayImportModal,
  type ImportedDay,
} from "@/components/ui/DayImportModal";
import type { FormExercise, FormSet } from "@/types";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Download,
} from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DayEditorPanelProps {
  exercises: FormExercise[];
  onChange: (exercises: FormExercise[]) => void;
  /** Show the "Import Day" button (default: true) */
  showImportDay?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newClientId(): string {
  return crypto.randomUUID();
}

function makeExercise(name: string, sets: FormSet[]): FormExercise {
  return { clientId: newClientId(), name, sets };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DayEditorPanel({
  exercises,
  onChange,
  showImportDay = true,
}: DayEditorPanelProps) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showDayImport, setShowDayImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ─── Drag-and-drop state ────────────────────────────────────────────────────
  const dragFrom = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  // ─── Exercise operations ─────────────────────────────────────────────────────

  function addFromPicker(picked: {
    name: string;
    default_reps: number;
    default_weight: number;
  }) {
    const ex = makeExercise(picked.name, [
      { reps: picked.default_reps, weight: picked.default_weight },
    ]);
    onChange([...exercises, ex]);
  }

  function addBlank() {
    const ex = makeExercise("", [{ reps: 10, weight: 0 }]);
    onChange([...exercises, ex]);
  }

  function removeExercise(index: number) {
    onChange(exercises.filter((_, i) => i !== index));
    setDeleteConfirm(null);
  }

  function updateName(index: number, name: string) {
    const updated = exercises.map((ex, i) =>
      i === index ? { ...ex, name } : ex,
    );
    onChange(updated);
  }

  function moveExercise(from: number, to: number) {
    if (to < 0 || to >= exercises.length) return;
    const updated = [...exercises];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  }

  // ─── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    dragFrom.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragOver.current = index;
  }

  function handleDrop() {
    const from = dragFrom.current;
    const to = dragOver.current;
    if (from !== null && to !== null && from !== to) {
      moveExercise(from, to);
    }
    dragFrom.current = null;
    dragOver.current = null;
  }

  // ─── Set operations ──────────────────────────────────────────────────────────

  function addSet(exIndex: number) {
    const ex = exercises[exIndex];
    const lastSet = ex.sets[ex.sets.length - 1];
    const newSet: FormSet = {
      reps: lastSet?.reps ?? 10,
      weight: lastSet?.weight ?? 0,
    };
    const updated = exercises.map((e, i) =>
      i === exIndex ? { ...e, sets: [...e.sets, newSet] } : e,
    );
    onChange(updated);
  }

  function removeSet(exIndex: number, setIndex: number) {
    const updated = exercises.map((e, i) => {
      if (i !== exIndex) return e;
      return { ...e, sets: e.sets.filter((_, si) => si !== setIndex) };
    });
    onChange(updated);
  }

  function updateSet(
    exIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: number,
  ) {
    const updated = exercises.map((e, i) => {
      if (i !== exIndex) return e;
      const sets = e.sets.map((s, si) =>
        si === setIndex ? { ...s, [field]: value } : s,
      );
      return { ...e, sets };
    });
    onChange(updated);
  }

  function moveSet(exIndex: number, from: number, to: number) {
    if (to < 0) return;
    const ex = exercises[exIndex];
    if (to >= ex.sets.length) return;
    const sets = [...ex.sets];
    const [moved] = sets.splice(from, 1);
    sets.splice(to, 0, moved);
    const updated = exercises.map((e, i) =>
      i === exIndex ? { ...e, sets } : e,
    );
    onChange(updated);
  }

  // ─── Day import (clone) ──────────────────────────────────────────────────────

  function handleDayImport(imported: ImportedDay) {
    const newExercises: FormExercise[] = imported.exercises.map((ex) =>
      makeExercise(
        ex.name,
        ex.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
      ),
    );
    onChange([...exercises, ...newExercises]);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const existingNames = exercises.map((e) => e.name);

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex items-center justify-end gap-1.5 mb-3 flex-wrap">
        {showImportDay && (
          <button
            onClick={() => setShowDayImport(true)}
            className="p-1.5 text-slate-500 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
            title="Import existing day"
            aria-label="Import existing day"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        <Button
          variant="secondary"
          onClick={() => setShowExercisePicker(true)}
          className="text-xs px-2 py-1"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Library
        </Button>
        <Button
          variant="secondary"
          onClick={addBlank}
          className="text-xs px-2 py-1"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          New
        </Button>
      </div>

      {/* ── Empty state ──────────────────────────────── */}
      {exercises.length === 0 && (
        <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg">
          <p className="text-slate-500 text-sm mb-3">No exercises yet</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={() => setShowExercisePicker(true)}
              className="text-xs"
            >
              From Library
            </Button>
            {showImportDay && (
              <Button
                variant="secondary"
                onClick={() => setShowDayImport(true)}
                className="text-xs"
              >
                Import Day
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={addBlank}
              className="text-xs"
            >
              Create New
            </Button>
          </div>
        </div>
      )}

      {/* ── Exercise list ────────────────────────────── */}
      <div
        className="space-y-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {exercises.map((ex, exIndex) => (
          <div
            key={ex.clientId}
            draggable
            onDragStart={() => handleDragStart(exIndex)}
            onDragOver={(e) => handleDragOver(e, exIndex)}
            className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50"
          >
            {/* Exercise header row */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4 text-slate-600" />
              </div>

              <input
                value={ex.name}
                onChange={(e) => updateName(exIndex, e.target.value)}
                placeholder="Exercise name"
                aria-label={`Exercise ${exIndex + 1} name`}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Move up / down */}
              <div className="flex flex-col flex-shrink-0">
                <button
                  onClick={() => moveExercise(exIndex, exIndex - 1)}
                  disabled={exIndex === 0}
                  aria-label="Move exercise up"
                  className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveExercise(exIndex, exIndex + 1)}
                  disabled={exIndex === exercises.length - 1}
                  aria-label="Move exercise down"
                  className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setDeleteConfirm(exIndex)}
                aria-label={`Remove exercise ${ex.name || exIndex + 1}`}
                className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sets table */}
            {ex.sets.length > 0 && (
              <div className="mb-2">
                <div className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 text-xs text-slate-500 mb-1 px-1">
                  <span className="w-4" />
                  <span className="w-6 text-center">Set</span>
                  <span>Reps</span>
                  <span>Weight (kg)</span>
                  <span className="w-6" />
                </div>

                {ex.sets.map((s, setIndex) => (
                  <div
                    key={setIndex}
                    className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 items-center mb-1.5"
                  >
                    {/* Set reorder */}
                    <div className="flex flex-col w-4">
                      <button
                        onClick={() => moveSet(exIndex, setIndex, setIndex - 1)}
                        disabled={setIndex === 0}
                        aria-label="Move set up"
                        className="text-slate-600 hover:text-slate-400 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveSet(exIndex, setIndex, setIndex + 1)}
                        disabled={setIndex === ex.sets.length - 1}
                        aria-label="Move set down"
                        className="text-slate-600 hover:text-slate-400 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-slate-500 text-xs w-6 text-center">
                      {setIndex + 1}
                    </span>

                    <input
                      type="number"
                      value={s.reps || ""}
                      onChange={(e) =>
                        updateSet(
                          exIndex,
                          setIndex,
                          "reps",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      aria-label={`Set ${setIndex + 1} reps`}
                      min={1}
                      className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <input
                      type="number"
                      value={s.weight || ""}
                      onChange={(e) =>
                        updateSet(
                          exIndex,
                          setIndex,
                          "weight",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      aria-label={`Set ${setIndex + 1} weight`}
                      min={0}
                      step={0.5}
                      className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <button
                      onClick={() => removeSet(exIndex, setIndex)}
                      aria-label={`Remove set ${setIndex + 1}`}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => addSet(exIndex)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
            >
              + Add Set
            </button>
          </div>
        ))}
      </div>

      {/* ── Modals ───────────────────────────────────── */}
      <ExercisePickerModal
        isOpen={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={(picked) => {
          addFromPicker(picked);
          setShowExercisePicker(false);
        }}
        existingNames={existingNames}
      />

      {showImportDay && (
        <DayImportModal
          isOpen={showDayImport}
          onClose={() => setShowDayImport(false)}
          onImport={handleDayImport}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Remove Exercise"
        message={
          deleteConfirm !== null
            ? `Remove "${exercises[deleteConfirm]?.name || "this exercise"}"?`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (deleteConfirm !== null) removeExercise(deleteConfirm);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
