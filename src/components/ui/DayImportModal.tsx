/**
 * DayImportModal
 *
 * Modal for importing a full day's exercises + sets into the template builder.
 * Tabs: From Day Library / From Previous Weeks / From Other Templates.
 * Always clones — never creates references.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Layout";
import { Modal } from "@/components/ui/Form";
import { getAllDayLibraryItems } from "@/lib/dayLibraryService";
import {
  getAllWeekTemplates,
  getWeekTemplateById,
} from "@/lib/weekTemplateService";
import { workoutApi } from "@/lib/api";
import type {
  DayLibraryItem,
  WeekTemplate,
  DayTemplateWithExercises,
  WorkoutWithExercises,
} from "@/types";
import {
  Library,
  Calendar,
  LayoutTemplate,
  Loader2,
  Dumbbell,
  ChevronRight,
} from "lucide-react";

// ─── Cloned exercise shape (output) ──────────────────────────────────────────

export interface ImportedExercise {
  name: string;
  sets: { reps: number; weight: number }[];
}

export interface ImportedDay {
  name: string;
  exercises: ImportedExercise[];
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type ImportTab = "library" | "weeks" | "templates";

interface DayImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with cloned exercises when user picks a day */
  onImport: (imported: ImportedDay) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DayImportModal({
  isOpen,
  onClose,
  onImport,
}: DayImportModalProps) {
  const [tab, setTab] = useState<ImportTab>("library");
  const [loading, setLoading] = useState(false);

  // Library tab
  const [dayLibrary, setDayLibrary] = useState<DayLibraryItem[]>([]);

  // Weeks tab
  const [weekWorkouts, setWeekWorkouts] = useState<WorkoutWithExercises[]>([]);

  // Templates tab
  const [weekTemplates, setWeekTemplates] = useState<WeekTemplate[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [templateDays, setTemplateDays] = useState<DayTemplateWithExercises[]>(
    [],
  );
  const [loadingTemplateDays, setLoadingTemplateDays] = useState(false);

  // ─── Load data ──────────────────────────────────────────────────────────────

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getAllDayLibraryItems();
      setDayLibrary(items);
    } catch (err) {
      console.error("[DayImportModal] loadLibrary error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeeks = useCallback(async () => {
    try {
      setLoading(true);
      // Get last 4 weeks of workouts
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const weeks = await workoutApi.getByWeeks(fourWeeksAgo);
      const allWorkouts = weeks.flatMap((w) => w.workouts);
      setWeekWorkouts(allWorkouts);
    } catch (err) {
      console.error("[DayImportModal] loadWeeks error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const temps = await getAllWeekTemplates();
      setWeekTemplates(temps);
    } catch (err) {
      console.error("[DayImportModal] loadTemplates error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setExpandedTemplate(null);
    setTemplateDays([]);

    if (tab === "library") loadLibrary();
    else if (tab === "weeks") loadWeeks();
    else if (tab === "templates") loadTemplates();
  }, [isOpen, tab, loadLibrary, loadWeeks, loadTemplates]);

  // ─── Expand a week template to see its days ─────────────────────────────────

  async function expandTemplate(templateId: string) {
    if (expandedTemplate === templateId) {
      setExpandedTemplate(null);
      setTemplateDays([]);
      return;
    }
    try {
      setLoadingTemplateDays(true);
      setExpandedTemplate(templateId);
      const full = await getWeekTemplateById(templateId);
      setTemplateDays(full.day_templates ?? []);
    } catch (err) {
      console.error("[DayImportModal] expandTemplate error:", err);
      setTemplateDays([]);
    } finally {
      setLoadingTemplateDays(false);
    }
  }

  // ─── Import handlers (clone) ────────────────────────────────────────────────

  function importFromLibrary(day: DayLibraryItem) {
    const imported: ImportedDay = {
      name: day.name,
      exercises: day.day_library_exercises.map((ex) => ({
        name: ex.name,
        sets: ex.day_library_sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
        })),
      })),
    };
    onImport(imported);
    onClose();
  }

  function importFromWorkout(workout: WorkoutWithExercises) {
    const imported: ImportedDay = {
      name: workout.title || "Imported Day",
      exercises: (workout.workout_exercises ?? []).map((we) => ({
        name: we.exercise?.name ?? "Unknown",
        sets: (we.sets ?? []).map((s) => ({
          reps: s.reps,
          weight: s.weight,
        })),
      })),
    };
    onImport(imported);
    onClose();
  }

  function importFromTemplateDay(day: DayTemplateWithExercises) {
    const imported: ImportedDay = {
      name: day.name,
      exercises: (day.exercise_templates ?? []).map((ex) => ({
        name: ex.name,
        sets: (ex.template_sets ?? []).map((s) => ({
          reps: s.reps,
          weight: s.weight,
        })),
      })),
    };
    onImport(imported);
    onClose();
  }

  // ─── Tab content renderers ──────────────────────────────────────────────────

  function renderLoading() {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        <span className="text-secondary ml-2 text-sm">Loading…</span>
      </div>
    );
  }

  function renderEmpty(msg: string) {
    return (
      <div className="text-center py-10">
        <Dumbbell className="w-10 h-10 text-muted mx-auto mb-3" />
        <p className="text-muted text-sm">{msg}</p>
      </div>
    );
  }

  function renderLibraryTab() {
    if (loading) return renderLoading();
    if (dayLibrary.length === 0)
      return renderEmpty("No saved days in your library yet.");

    return (
      <div className="space-y-2">
        {dayLibrary.map((day) => (
          <button
            key={day.id}
            onClick={() => importFromLibrary(day)}
            className="w-full text-left px-3 py-3 rounded-lg hover:bg-elevated active:bg-elevated transition-colors"
          >
            <p className="text-primary font-medium text-sm">{day.name}</p>
            <p className="text-muted text-xs mt-0.5">
              {day.day_library_exercises.length} exercise
              {day.day_library_exercises.length !== 1 ? "s" : ""}
              {day.day_library_exercises.length > 0 && (
                <>
                  {" — "}
                  {day.day_library_exercises.map((e) => e.name).join(", ")}
                </>
              )}
            </p>
          </button>
        ))}
      </div>
    );
  }

  function renderWeeksTab() {
    if (loading) return renderLoading();
    if (weekWorkouts.length === 0)
      return renderEmpty("No recent workouts found.");

    return (
      <div className="space-y-2">
        {weekWorkouts.map((w) => (
          <button
            key={w.id}
            onClick={() => importFromWorkout(w)}
            className="w-full text-left px-3 py-3 rounded-lg hover:bg-elevated active:bg-elevated transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-primary font-medium text-sm">
                {w.title || "Untitled Workout"}
              </p>
              <p className="text-muted text-xs">{w.date}</p>
            </div>
            <p className="text-muted text-xs mt-0.5">
              {w.workout_exercises.length} exercise
              {w.workout_exercises.length !== 1 ? "s" : ""}
            </p>
          </button>
        ))}
      </div>
    );
  }

  function renderTemplatesTab() {
    if (loading) return renderLoading();
    if (weekTemplates.length === 0)
      return renderEmpty("No weekly templates found.");

    return (
      <div className="space-y-2">
        {weekTemplates.map((t) => (
          <div key={t.id}>
            <button
              onClick={() => expandTemplate(t.id)}
              className="w-full text-left px-3 py-3 rounded-lg hover:bg-elevated active:bg-elevated transition-colors flex items-center justify-between"
            >
              <p className="text-primary font-medium text-sm">{t.name}</p>
              <ChevronRight
                className={`w-4 h-4 text-muted transition-transform ${
                  expandedTemplate === t.id ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Expanded: show days */}
            {expandedTemplate === t.id && (
              <div className="ml-4 mt-1 space-y-1">
                {loadingTemplateDays ? (
                  <div className="py-3 text-center">
                    <Loader2 className="w-4 h-4 text-secondary animate-spin inline" />
                  </div>
                ) : templateDays.length === 0 ? (
                  <p className="text-muted text-xs py-2 pl-2">
                    No days in this template.
                  </p>
                ) : (
                  templateDays.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => importFromTemplateDay(day)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-elevated active:bg-elevated transition-colors border border-primary"
                    >
                      <p className="text-primary text-sm">{day.name}</p>
                      <p className="text-muted text-xs mt-0.5">
                        {day.exercise_templates.length} exercise
                        {day.exercise_templates.length !== 1 ? "s" : ""}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  const tabs: { id: ImportTab; label: string; icon: typeof Library }[] = [
    { id: "library", label: "Day Library", icon: Library },
    { id: "weeks", label: "Previous Weeks", icon: Calendar },
    { id: "templates", label: "Other Templates", icon: LayoutTemplate },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Existing Day">
      <div className="space-y-3">
        {/* Tab bar */}
        <div className="flex gap-1 bg-elevated rounded-lg p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                  tab === t.id
                    ? "bg-accent-primary text-primary"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ").pop()}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {tab === "library" && renderLibraryTab()}
          {tab === "weeks" && renderWeeksTab()}
          {tab === "templates" && renderTemplatesTab()}
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full">
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
