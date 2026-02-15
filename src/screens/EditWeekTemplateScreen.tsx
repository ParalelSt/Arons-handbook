/**
 * EditWeekTemplateScreen
 *
 * Professional template builder with:
 * - Day toggle grid (Mon-Sun)
 * - Structured day cards with exercises & sets
 * - Exercise Picker (library search/sort/group/create)
 * - Day Import (from library / previous weeks / other templates)
 * - Drag & drop reordering (exercises within day, sets within exercise)
 * - Save day to library
 * - Duplicate prevention & confirmation dialogs
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Form";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExercisePickerModal } from "@/components/ui/ExercisePickerModal";
import {
  DayImportModal,
  type ImportedDay,
} from "@/components/ui/DayImportModal";
import {
  getWeekTemplateById,
  saveWeekTemplateFull,
} from "@/lib/weekTemplateService";
import { saveDayToLibrary } from "@/lib/dayLibraryService";
import type { SaveDayInput, SaveExerciseInput, SaveSetInput } from "@/types";
import {
  Plus,
  Trash2,
  Save,
  GripVertical,
  Download,
  BookmarkPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// ─── Local form state types ───────────────────────────────────────────────────

interface FormSet {
  reps: number;
  weight: number;
}

interface FormExercise {
  name: string;
  sets: FormSet[];
}

interface FormDay {
  name: string;
  exercises: FormExercise[];
}

export function EditWeekTemplateScreen() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const [templateName, setTemplateName] = useState("");
  const [days, setDays] = useState<FormDay[]>([]);
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // ─── Modal state ────────────────────────────────────────────────────────────

  const [exercisePickerDayIndex, setExercisePickerDayIndex] = useState<
    number | null
  >(null);
  const [showDayImport, setShowDayImport] = useState(false);
  const [dayImportTargetIndex, setDayImportTargetIndex] = useState<
    number | null
  >(null);
  const [saveToDayLibraryIndex, setSaveToDayLibraryIndex] = useState<
    number | null
  >(null);
  const [deleteExConfirm, setDeleteExConfirm] = useState<{
    dayIndex: number;
    exIndex: number;
  } | null>(null);

  // ─── Drag state (exercise reorder) ──────────────────────────────────────────

  const dragExercise = useRef<{
    dayIndex: number;
    exIndex: number;
  } | null>(null);
  const dragOverExercise = useRef<{
    dayIndex: number;
    exIndex: number;
  } | null>(null);

  // ─── Load existing template ─────────────────────────────────────────────────

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      setError("");
      const data = await getWeekTemplateById(templateId);
      setTemplateName(data.name);

      const formDays: FormDay[] = (data.day_templates ?? []).map((d) => ({
        name: d.name,
        exercises: (d.exercise_templates ?? []).map((ex) => ({
          name: ex.name,
          sets: (ex.template_sets ?? []).map((s) => ({
            reps: s.reps,
            weight: s.weight,
          })),
        })),
      }));

      setDays(formDays);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load template";
      console.error("[EditWeekTemplateScreen] load error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // ─── Day toggles ───────────────────────────────────────────────────────────

  const activeDayNames = new Set(days.map((d) => d.name));

  function toggleDay(dayName: string) {
    if (activeDayNames.has(dayName)) {
      setDays((prev) => prev.filter((d) => d.name !== dayName));
    } else {
      setDays((prev) => {
        const updated = [...prev, { name: dayName, exercises: [] }];
        return updated.sort(
          (a, b) =>
            ALL_DAYS.indexOf(a.name as (typeof ALL_DAYS)[number]) -
            ALL_DAYS.indexOf(b.name as (typeof ALL_DAYS)[number]),
        );
      });
    }
  }

  // ─── Exercise management ────────────────────────────────────────────────────

  function addExerciseManual(dayIndex: number) {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: [
          ...updated[dayIndex].exercises,
          { name: "", sets: [{ reps: 10, weight: 0 }] },
        ],
      };
      return updated;
    });
  }

  function addExerciseFromPicker(
    dayIndex: number,
    picked: {
      name: string;
      default_reps: number;
      default_weight: number;
    },
  ) {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: [
          ...updated[dayIndex].exercises,
          {
            name: picked.name,
            sets: [
              { reps: picked.default_reps, weight: picked.default_weight },
            ],
          },
        ],
      };
      return updated;
    });
  }

  function removeExercise(dayIndex: number, exIndex: number) {
    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: updated[dayIndex].exercises.filter((_, i) => i !== exIndex),
      };
      return updated;
    });
    setDeleteExConfirm(null);
  }

  function updateExerciseName(dayIndex: number, exIndex: number, name: string) {
    setDays((prev) => {
      const updated = [...prev];
      const exercises = [...updated[dayIndex].exercises];
      exercises[exIndex] = { ...exercises[exIndex], name };
      updated[dayIndex] = { ...updated[dayIndex], exercises };
      return updated;
    });
  }

  // ─── Exercise reorder ──────────────────────────────────────────────────────

  function moveExercise(dayIndex: number, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setDays((prev) => {
      const updated = [...prev];
      const exercises = [...updated[dayIndex].exercises];
      const [moved] = exercises.splice(fromIndex, 1);
      exercises.splice(toIndex, 0, moved);
      updated[dayIndex] = { ...updated[dayIndex], exercises };
      return updated;
    });
  }

  function handleExerciseDragStart(dayIndex: number, exIndex: number) {
    dragExercise.current = { dayIndex, exIndex };
  }

  function handleExerciseDragOver(
    e: React.DragEvent,
    dayIndex: number,
    exIndex: number,
  ) {
    e.preventDefault();
    dragOverExercise.current = { dayIndex, exIndex };
  }

  function handleExerciseDrop(dayIndex: number) {
    if (
      dragExercise.current &&
      dragOverExercise.current &&
      dragExercise.current.dayIndex === dayIndex &&
      dragOverExercise.current.dayIndex === dayIndex
    ) {
      moveExercise(
        dayIndex,
        dragExercise.current.exIndex,
        dragOverExercise.current.exIndex,
      );
    }
    dragExercise.current = null;
    dragOverExercise.current = null;
  }

  // ─── Set management ─────────────────────────────────────────────────────────

  function addSet(dayIndex: number, exIndex: number) {
    setDays((prev) => {
      const updated = [...prev];
      const exercises = [...updated[dayIndex].exercises];
      const ex = exercises[exIndex];
      const lastSet = ex.sets[ex.sets.length - 1];
      exercises[exIndex] = {
        ...ex,
        sets: [
          ...ex.sets,
          { reps: lastSet?.reps ?? 10, weight: lastSet?.weight ?? 0 },
        ],
      };
      updated[dayIndex] = { ...updated[dayIndex], exercises };
      return updated;
    });
  }

  function removeSet(dayIndex: number, exIndex: number, setIndex: number) {
    setDays((prev) => {
      const updated = [...prev];
      const exercises = [...updated[dayIndex].exercises];
      const ex = exercises[exIndex];
      exercises[exIndex] = {
        ...ex,
        sets: ex.sets.filter((_, i) => i !== setIndex),
      };
      updated[dayIndex] = { ...updated[dayIndex], exercises };
      return updated;
    });
  }

  function updateSet(
    dayIndex: number,
    exIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: number,
  ) {
    setDays((prev) => {
      const updated = [...prev];
      const exercises = [...updated[dayIndex].exercises];
      const ex = exercises[exIndex];
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      exercises[exIndex] = { ...ex, sets };
      updated[dayIndex] = { ...updated[dayIndex], exercises };
      return updated;
    });
  }

  function moveSet(
    dayIndex: number,
    exIndex: number,
    fromIndex: number,
    toIndex: number,
  ) {
    if (fromIndex === toIndex) return;
    setDays((prev) => {
      const updated = [...prev];
      const exercises = [...updated[dayIndex].exercises];
      const ex = exercises[exIndex];
      const sets = [...ex.sets];
      const [moved] = sets.splice(fromIndex, 1);
      sets.splice(toIndex, 0, moved);
      exercises[exIndex] = { ...ex, sets };
      updated[dayIndex] = { ...updated[dayIndex], exercises };
      return updated;
    });
  }

  // ─── Import day ─────────────────────────────────────────────────────────────

  function handleDayImport(imported: ImportedDay) {
    if (dayImportTargetIndex === null) return;

    setDays((prev) => {
      const updated = [...prev];
      const day = updated[dayImportTargetIndex];
      // Append imported exercises to existing day
      updated[dayImportTargetIndex] = {
        ...day,
        exercises: [
          ...day.exercises,
          ...imported.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
          })),
        ],
      };
      return updated;
    });

    setDayImportTargetIndex(null);
    setShowDayImport(false);
    setToast(
      `Imported ${imported.exercises.length} exercises from "${imported.name}"`,
    );
  }

  // ─── Save day to library ───────────────────────────────────────────────────

  async function handleSaveDayToLibrary() {
    if (saveToDayLibraryIndex === null) return;
    const day = days[saveToDayLibraryIndex];
    if (!day || day.exercises.length === 0) {
      setError("Day must have at least one exercise to save to library.");
      setSaveToDayLibraryIndex(null);
      return;
    }

    try {
      await saveDayToLibrary({
        name: day.name,
        exercises: day.exercises
          .filter((ex) => ex.name.trim())
          .map((ex) => ({
            name: ex.name.trim(),
            sets: ex.sets.map((s) => ({
              reps: Math.max(1, s.reps || 1),
              weight: Math.max(0, s.weight || 0),
            })),
          })),
      });
      setToast(`"${day.name}" saved to Day Library!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save to library";
      setError(msg);
    } finally {
      setSaveToDayLibraryIndex(null);
    }
  }

  // ─── Save template ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!templateId) return;
    if (!templateName.trim()) {
      setError("Please enter a plan name.");
      return;
    }

    const validDays = days.filter(
      (d) =>
        d.exercises.length > 0 &&
        d.exercises.some((ex) => ex.name.trim() && ex.sets.length > 0),
    );

    if (validDays.length === 0) {
      setError("Add at least one day with exercises and sets.");
      return;
    }

    // Check for duplicate exercise names within same day
    for (const day of validDays) {
      const names = day.exercises
        .filter((ex) => ex.name.trim())
        .map((ex) => ex.name.trim().toLowerCase());
      const seen = new Set<string>();
      for (const n of names) {
        if (seen.has(n)) {
          setError(
            `Duplicate exercise "${n}" in ${day.name}. Remove or rename it.`,
          );
          return;
        }
        seen.add(n);
      }
    }

    const cleanDays: SaveDayInput[] = validDays.map((d) => ({
      name: d.name,
      exercises: d.exercises
        .filter((ex) => ex.name.trim() && ex.sets.length > 0)
        .map(
          (ex): SaveExerciseInput => ({
            name: ex.name.trim(),
            sets: ex.sets.map(
              (s): SaveSetInput => ({
                reps: Math.max(1, s.reps || 1),
                weight: Math.max(0, s.weight || 0),
              }),
            ),
          }),
        ),
    }));

    try {
      setSaving(true);
      setError("");
      await saveWeekTemplateFull(templateId, templateName.trim(), cleanDays);
      setToast("Week plan saved!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save template";
      console.error("[EditWeekTemplateScreen] save error:", err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container>
        <Header
          title="Edit Week Plan"
          onBack={() => navigate("/templates?tab=weekly")}
        />
        <div className="text-center py-12">
          <div className="text-slate-400">Loading plan…</div>
        </div>
      </Container>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <Container>
      <Header
        title="Edit Week Plan"
        onBack={() => navigate("/templates?tab=weekly")}
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          {
            label: "Templates",
            onClick: () => navigate("/templates?tab=weekly"),
          },
          { label: templateName || "Edit" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* ─── Step 1: Plan name ───────────────────────────── */}
        <Card className="p-4">
          <Input
            label="Plan Name"
            value={templateName}
            onChange={(v) => setTemplateName(v)}
            placeholder="e.g. Push/Pull/Legs"
          />
        </Card>

        {/* ─── Step 2: Day selector grid ───────────────────── */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-slate-400 mb-3">
            Training Days
          </label>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {ALL_DAYS.map((day) => {
              const active = activeDayNames.has(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-1 sm:px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <p className="text-slate-600 text-xs mt-2">
            {days.length} day{days.length !== 1 ? "s" : ""} selected
          </p>
        </Card>

        {/* ─── Step 3: Day cards ───────────────────────────── */}
        {days.map((day, dayIndex) => (
          <Card key={day.name} className="p-4">
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-base">{day.name}</h3>
              <div className="flex items-center gap-1.5">
                {/* Save to library */}
                {day.exercises.length > 0 && (
                  <button
                    onClick={() => setSaveToDayLibraryIndex(dayIndex)}
                    className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Save day to library"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                )}
                {/* Import day */}
                <button
                  onClick={() => {
                    setDayImportTargetIndex(dayIndex);
                    setShowDayImport(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Import existing day"
                >
                  <Download className="w-4 h-4" />
                </button>
                {/* Add exercise from library */}
                <Button
                  variant="secondary"
                  onClick={() => setExercisePickerDayIndex(dayIndex)}
                  className="text-xs px-2 py-1"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Library
                </Button>
                {/* Quick add blank exercise */}
                <Button
                  variant="secondary"
                  onClick={() => addExerciseManual(dayIndex)}
                  className="text-xs px-2 py-1"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  New
                </Button>
              </div>
            </div>

            {/* Empty state */}
            {day.exercises.length === 0 && (
              <div className="text-center py-6 border border-dashed border-slate-700 rounded-lg">
                <p className="text-slate-500 text-sm mb-2">No exercises yet</p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setExercisePickerDayIndex(dayIndex)}
                    className="text-xs"
                  >
                    From Library
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDayImportTargetIndex(dayIndex);
                      setShowDayImport(true);
                    }}
                    className="text-xs"
                  >
                    Import Day
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => addExerciseManual(dayIndex)}
                    className="text-xs"
                  >
                    Create New
                  </Button>
                </div>
              </div>
            )}

            {/* Exercise list (draggable) */}
            <div
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleExerciseDrop(dayIndex)}
            >
              {day.exercises.map((ex, exIndex) => (
                <div
                  key={exIndex}
                  draggable
                  onDragStart={() => handleExerciseDragStart(dayIndex, exIndex)}
                  onDragOver={(e) =>
                    handleExerciseDragOver(e, dayIndex, exIndex)
                  }
                  className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 transition-all"
                >
                  {/* Exercise header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="cursor-grab active:cursor-grabbing touch-none">
                      <GripVertical className="w-4 h-4 text-slate-600" />
                    </div>
                    <input
                      value={ex.name}
                      onChange={(e) =>
                        updateExerciseName(dayIndex, exIndex, e.target.value)
                      }
                      placeholder="Exercise name"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Move up/down buttons */}
                    <div className="flex flex-col">
                      <button
                        onClick={() =>
                          moveExercise(dayIndex, exIndex, exIndex - 1)
                        }
                        disabled={exIndex === 0}
                        className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          moveExercise(dayIndex, exIndex, exIndex + 1)
                        }
                        disabled={exIndex === day.exercises.length - 1}
                        className="p-0.5 text-slate-600 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteExConfirm({ dayIndex, exIndex })}
                      className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sets table */}
                  {ex.sets.length > 0 && (
                    <div className="mb-2">
                      <div className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 text-xs text-slate-500 mb-1 px-1">
                        <span className="w-4" />
                        <span className="w-6">Set</span>
                        <span>Reps</span>
                        <span>Weight (kg)</span>
                        <span className="w-6" />
                      </div>

                      {ex.sets.map((s, setIndex) => (
                        <div
                          key={setIndex}
                          className="grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 items-center mb-1.5"
                        >
                          {/* Set reorder buttons */}
                          <div className="flex flex-col w-4">
                            <button
                              onClick={() =>
                                moveSet(
                                  dayIndex,
                                  exIndex,
                                  setIndex,
                                  setIndex - 1,
                                )
                              }
                              disabled={setIndex === 0}
                              className="text-slate-600 hover:text-slate-400 disabled:opacity-20 transition-colors"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                moveSet(
                                  dayIndex,
                                  exIndex,
                                  setIndex,
                                  setIndex + 1,
                                )
                              }
                              disabled={setIndex === ex.sets.length - 1}
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
                                dayIndex,
                                exIndex,
                                setIndex,
                                "reps",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min={1}
                          />
                          <input
                            type="number"
                            value={s.weight || ""}
                            onChange={(e) =>
                              updateSet(
                                dayIndex,
                                exIndex,
                                setIndex,
                                "weight",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min={0}
                            step={0.5}
                          />
                          <button
                            onClick={() =>
                              removeSet(dayIndex, exIndex, setIndex)
                            }
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => addSet(dayIndex, exIndex)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                  >
                    + Add Set
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* No days selected hint */}
        {days.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">
              Select training days above to start building your plan.
            </p>
          </div>
        )}

        {/* Bottom save button */}
        {days.length > 0 && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? "Saving…" : "Save Week Plan"}
          </Button>
        )}
      </div>

      {/* ─── Modals ───────────────────────────────────────── */}

      {/* Exercise Picker */}
      <ExercisePickerModal
        isOpen={exercisePickerDayIndex !== null}
        onClose={() => setExercisePickerDayIndex(null)}
        onSelect={(picked) => {
          if (exercisePickerDayIndex !== null) {
            addExerciseFromPicker(exercisePickerDayIndex, picked);
          }
          setExercisePickerDayIndex(null);
        }}
        existingNames={
          exercisePickerDayIndex !== null
            ? days[exercisePickerDayIndex]?.exercises.map((e) => e.name)
            : []
        }
      />

      {/* Day Import */}
      <DayImportModal
        isOpen={showDayImport}
        onClose={() => {
          setShowDayImport(false);
          setDayImportTargetIndex(null);
        }}
        onImport={handleDayImport}
      />

      {/* Delete exercise confirmation */}
      <ConfirmDialog
        isOpen={deleteExConfirm !== null}
        title="Remove Exercise"
        message={
          deleteExConfirm
            ? `Remove "${days[deleteExConfirm.dayIndex]?.exercises[deleteExConfirm.exIndex]?.name || "this exercise"}" from ${days[deleteExConfirm.dayIndex]?.name}?`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (deleteExConfirm) {
            removeExercise(deleteExConfirm.dayIndex, deleteExConfirm.exIndex);
          }
        }}
        onCancel={() => setDeleteExConfirm(null)}
      />

      {/* Save day to library confirmation */}
      <ConfirmDialog
        isOpen={saveToDayLibraryIndex !== null}
        title="Save to Day Library"
        message={
          saveToDayLibraryIndex !== null
            ? `Save "${days[saveToDayLibraryIndex]?.name}" with ${days[saveToDayLibraryIndex]?.exercises.length} exercises to your Day Library?`
            : ""
        }
        confirmLabel="Save"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={handleSaveDayToLibrary}
        onCancel={() => setSaveToDayLibraryIndex(null)}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </Container>
  );
}
