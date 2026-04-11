"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getAllDayLibraryItems } from "@/lib/dayLibraryService";
import { getAllWeekTemplates, getWeekTemplateById } from "@/lib/weekTemplateService";
import { workoutApi } from "@/lib/api";
import type { DayLibraryItem, WeekTemplate, DayTemplateWithExercises, WorkoutWithExercises } from "@/types";
import { Library, Calendar, LayoutTemplate, Loader2, Dumbbell, ChevronRight } from "lucide-react";

export interface ImportedExercise { name: string; sets: { reps: number; weight: number }[]; }
export interface ImportedDay { name: string; exercises: ImportedExercise[]; }

type ImportTab = "library" | "weeks" | "templates";

interface DayImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (imported: ImportedDay) => void;
}

export function DayImportModal({ isOpen, onClose, onImport }: DayImportModalProps) {
  const [tab, setTab] = useState<ImportTab>("library");
  const [loading, setLoading] = useState(false);
  const [dayLibrary, setDayLibrary] = useState<DayLibraryItem[]>([]);
  const [weekWorkouts, setWeekWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [weekTemplates, setWeekTemplates] = useState<WeekTemplate[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [templateDays, setTemplateDays] = useState<DayTemplateWithExercises[]>([]);
  const [loadingTemplateDays, setLoadingTemplateDays] = useState(false);

  const loadLibrary = useCallback(async () => {
    try { setLoading(true); setDayLibrary(await getAllDayLibraryItems()); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const loadWeeks = useCallback(async () => {
    try {
      setLoading(true);
      const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const weeks = await workoutApi.getByWeeks(fourWeeksAgo);
      setWeekWorkouts(weeks.flatMap((w) => w.workouts));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const loadTemplates = useCallback(async () => {
    try { setLoading(true); setWeekTemplates(await getAllWeekTemplates()); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setExpandedTemplate(null); setTemplateDays([]);
    if (tab === "library") loadLibrary();
    else if (tab === "weeks") loadWeeks();
    else loadTemplates();
  }, [isOpen, tab, loadLibrary, loadWeeks, loadTemplates]);

  async function expandTemplate(id: string) {
    if (expandedTemplate === id) { setExpandedTemplate(null); setTemplateDays([]); return; }
    try { setLoadingTemplateDays(true); setExpandedTemplate(id); const full = await getWeekTemplateById(id); setTemplateDays(full.day_templates ?? []); }
    catch { setTemplateDays([]); } finally { setLoadingTemplateDays(false); }
  }

  function importFromLibrary(day: DayLibraryItem) {
    onImport({ name: day.name, exercises: day.day_library_exercises.map((ex) => ({ name: ex.name, sets: ex.day_library_sets.map((s) => ({ reps: s.reps, weight: s.weight })) })) });
    onClose();
  }

  function importFromWorkout(w: WorkoutWithExercises) {
    onImport({ name: w.title || "Imported Day", exercises: (w.workout_exercises ?? []).map((we) => ({ name: we.exercise?.name ?? "Unknown", sets: (we.sets ?? []).map((s) => ({ reps: s.reps, weight: s.weight })) })) });
    onClose();
  }

  function importFromTemplateDay(day: DayTemplateWithExercises) {
    onImport({ name: day.name, exercises: (day.exercise_templates ?? []).map((ex) => ({ name: ex.name, sets: (ex.template_sets ?? []).map((s) => ({ reps: s.reps, weight: s.weight })) })) });
    onClose();
  }

  const renderLoading = () => (
    <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-secondary animate-spin" /><span className="text-secondary ml-2 text-sm">Loading...</span></div>
  );
  const renderEmpty = (msg: string) => (
    <div className="text-center py-10"><Dumbbell className="w-10 h-10 text-muted mx-auto mb-3" /><p className="text-muted text-sm">{msg}</p></div>
  );

  const tabs: { id: ImportTab; label: string; icon: typeof Library }[] = [
    { id: "library", label: "Day Library", icon: Library },
    { id: "weeks", label: "Previous Weeks", icon: Calendar },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
  ];

  return (
    <Modal open={isOpen} onClose={onClose} title="Import Existing Day" size="md">
      <div className="space-y-3">
        <div className="flex gap-1 bg-elevated rounded-lg p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-colors ${tab === t.id ? "text-white" : "text-secondary hover:text-primary"}`} style={tab === t.id ? { backgroundColor: 'var(--accent-primary)' } : undefined}>
                <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.label.split(" ").pop()}</span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {tab === "library" && (loading ? renderLoading() : dayLibrary.length === 0 ? renderEmpty("No saved days yet.") : (
            <div className="space-y-2">{dayLibrary.map((day) => (
              <button key={day.id} onClick={() => importFromLibrary(day)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-elevated transition-colors">
                <p className="text-primary font-medium text-sm">{day.name}</p>
                <p className="text-muted text-xs mt-0.5">{day.day_library_exercises.length} exercise{day.day_library_exercises.length !== 1 ? "s" : ""}</p>
              </button>
            ))}</div>
          ))}

          {tab === "weeks" && (loading ? renderLoading() : weekWorkouts.length === 0 ? renderEmpty("No recent workouts.") : (
            <div className="space-y-2">{weekWorkouts.map((w) => (
              <button key={w.id} onClick={() => importFromWorkout(w)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-elevated transition-colors">
                <div className="flex items-center justify-between"><p className="text-primary font-medium text-sm">{w.title || "Untitled"}</p><p className="text-muted text-xs">{w.date}</p></div>
                <p className="text-muted text-xs mt-0.5">{w.workout_exercises.length} exercises</p>
              </button>
            ))}</div>
          ))}

          {tab === "templates" && (loading ? renderLoading() : weekTemplates.length === 0 ? renderEmpty("No templates found.") : (
            <div className="space-y-2">{weekTemplates.map((t) => (
              <div key={t.id}>
                <button onClick={() => expandTemplate(t.id)} className="w-full text-left px-3 py-3 rounded-lg hover:bg-elevated transition-colors flex items-center justify-between">
                  <p className="text-primary font-medium text-sm">{t.name}</p>
                  <ChevronRight className={`w-4 h-4 text-muted transition-transform ${expandedTemplate === t.id ? "rotate-90" : ""}`} />
                </button>
                {expandedTemplate === t.id && (
                  <div className="ml-4 mt-1 space-y-1">
                    {loadingTemplateDays ? <div className="py-3 text-center"><Loader2 className="w-4 h-4 text-secondary animate-spin inline" /></div>
                    : templateDays.length === 0 ? <p className="text-muted text-xs py-2 pl-2">No days</p>
                    : templateDays.map((day) => (
                      <button key={day.id} onClick={() => importFromTemplateDay(day)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-elevated transition-colors border border-primary">
                        <p className="text-primary text-sm">{day.name}</p>
                        <p className="text-muted text-xs mt-0.5">{day.exercise_templates.length} exercises</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}</div>
          ))}
        </div>

        <Button variant="secondary" onClick={onClose} className="w-full">Cancel</Button>
      </div>
    </Modal>
  );
}
