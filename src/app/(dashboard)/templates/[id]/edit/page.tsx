"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWeekTemplateById, saveWeekTemplateFull, generateWeekFromTemplate } from "@/lib/weekTemplateService";
import { saveDayToLibrary } from "@/lib/dayLibraryService";
import type { FormExercise, SaveDayInput } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { DayEditorPanel } from "@/components/workout/DayEditorPanel";
import { Save, Play, BookmarkPlus } from "lucide-react";
import { format, startOfWeek } from "date-fns";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DayState {
  name: string;
  exercises: FormExercise[];
}

export default function EditWeekTemplatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [dayStates, setDayStates] = useState<Map<string, DayState>>(new Map());
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateDate, setGenerateDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getWeekTemplateById(params.id)
      .then((t) => {
        setTemplateName(t.name);
        const days = new Map<string, DayState>();
        const selected = new Set<string>();
        for (const dt of t.day_templates) {
          selected.add(dt.name);
          days.set(dt.name, {
            name: dt.name,
            exercises: dt.exercise_templates.map((ex) => ({
              clientId: crypto.randomUUID(),
              name: ex.name,
              sets: ex.template_sets.map((s) => ({ reps: s.reps, weight: s.weight })),
            })),
          });
        }
        setSelectedDays(selected);
        setDayStates(days);
        if (selected.size > 0) setActiveDay([...selected][0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  function toggleDay(day: string) {
    const next = new Set(selectedDays);
    if (next.has(day)) {
      next.delete(day);
      const nextMap = new Map(dayStates);
      nextMap.delete(day);
      setDayStates(nextMap);
      if (activeDay === day) setActiveDay([...next][0] || null);
    } else {
      next.add(day);
      if (!dayStates.has(day)) {
        setDayStates(new Map(dayStates).set(day, { name: day, exercises: [] }));
      }
      setActiveDay(day);
    }
    setSelectedDays(next);
  }

  function updateDayName(day: string, newName: string) {
    const state = dayStates.get(day);
    if (!state) return;
    const nextMap = new Map(dayStates);
    nextMap.set(day, { ...state, name: newName });
    setDayStates(nextMap);
  }

  function updateDayExercises(day: string, exercises: FormExercise[]) {
    const state = dayStates.get(day);
    if (!state) return;
    const nextMap = new Map(dayStates);
    nextMap.set(day, { ...state, exercises });
    setDayStates(nextMap);
  }

  async function handleSave() {
    const days: SaveDayInput[] = ALL_DAYS.filter((d) => selectedDays.has(d)).map((d) => {
      const state = dayStates.get(d);
      return {
        name: state?.name || d,
        exercises: (state?.exercises || []).filter((ex) => ex.name.trim()).map((ex) => ({
          name: ex.name,
          sets: ex.sets,
        })),
      };
    });

    try {
      setSaving(true);
      await saveWeekTemplateFull(params.id, templateName, days);
      setToast({ msg: "Template saved!", type: "success" });
    } catch { setToast({ msg: "Failed to save", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      await generateWeekFromTemplate(params.id, new Date(generateDate));
      setShowGenerate(false);
      setToast({ msg: "Week generated!", type: "success" });
    } catch { setToast({ msg: "Failed to generate", type: "error" }); }
    finally { setGenerating(false); }
  }

  async function handleSaveDayToLibrary(day: string) {
    const state = dayStates.get(day);
    if (!state) return;
    try {
      await saveDayToLibrary({
        name: state.name,
        exercises: state.exercises.filter((ex) => ex.name.trim()).map((ex) => ({
          name: ex.name,
          sets: ex.sets,
        })),
      });
      setToast({ msg: `"${state.name}" saved to library!`, type: "success" });
    } catch { setToast({ msg: "Failed to save to library", type: "error" }); }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Template" backHref="/templates" />
        <div className="px-4 md:px-6"><div className="bg-card rounded-xl h-64 animate-pulse border border-primary" /></div>
      </div>
    );
  }

  const activeDayState = activeDay ? dayStates.get(activeDay) : null;

  return (
    <div>
      <PageHeader
        title="Edit Template"
        backHref="/templates"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowGenerate(true)}><Play size={14} /> Generate</Button>
            <Button size="sm" onClick={handleSave} loading={saving}><Save size={14} /> Save</Button>
          </div>
        }
      />

      <div className="px-4 md:px-6 space-y-4">
        {/* Template name */}
        <Input label="Template Name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Push/Pull/Legs" />

        {/* Day selector */}
        <div>
          <p className="text-sm font-medium text-secondary mb-2">Training Days</p>
          <div className="grid grid-cols-7 gap-1.5">
            {ALL_DAYS.map((day) => {
              const selected = selectedDays.has(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                    selected ? "text-white border-transparent" : "bg-elevated text-muted border-primary hover:text-primary"
                  }`}
                  style={selected ? { backgroundColor: "var(--accent-primary)" } : undefined}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day tabs */}
        {selectedDays.size > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {ALL_DAYS.filter((d) => selectedDays.has(d)).map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeDay === day ? "text-white" : "bg-elevated text-secondary hover:text-primary"
                }`}
                style={activeDay === day ? { backgroundColor: "var(--accent-primary)" } : undefined}
              >
                {dayStates.get(day)?.name || day}
              </button>
            ))}
          </div>
        )}

        {/* Active day editor */}
        {activeDay && activeDayState && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                label="Day Name"
                value={activeDayState.name}
                onChange={(e) => updateDayName(activeDay, e.target.value)}
                placeholder={activeDay}
                className="flex-1"
              />
              <Button variant="ghost" size="sm" onClick={() => handleSaveDayToLibrary(activeDay)} className="mt-6" title="Save to day library">
                <BookmarkPlus size={16} />
              </Button>
            </div>

            <DayEditorPanel
              exercises={activeDayState.exercises}
              onChange={(exercises) => updateDayExercises(activeDay, exercises)}
            />
          </div>
        )}
      </div>

      {/* Generate modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Week" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-secondary">Create workouts for each training day starting from:</p>
          <Input label="Week Start (Monday)" type="date" value={generateDate} onChange={(e) => setGenerateDate(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={handleGenerate} loading={generating}>Generate</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
