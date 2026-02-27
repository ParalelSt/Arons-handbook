/**
 * EditWeekTemplateScreen
 *
 * Professional template builder.
 * Exercise editing is fully delegated to DayEditorPanel — same UX as live
 * workout editing. This screen only manages: template name, day toggles, and
 * save-to-library / save-template actions.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Form";
import { Toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DayEditorPanel } from "@/components/ui/DayEditorPanel";
import {
  getWeekTemplateById,
  saveWeekTemplateFull,
} from "@/lib/weekTemplateService";
import { saveDayToLibrary } from "@/lib/dayLibraryService";
import type {
  FormExercise,
  SaveDayInput,
  SaveExerciseInput,
  SaveSetInput,
} from "@/types";
import { Save, BookmarkPlus } from "lucide-react";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// ─── Local form state ─────────────────────────────────────────────────────────

interface FormDay {
  name: string;
  exercises: FormExercise[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditWeekTemplateScreen() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const [templateName, setTemplateName] = useState("");
  const [days, setDays] = useState<FormDay[]>([]);
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [saveToDayLibraryIndex, setSaveToDayLibraryIndex] = useState<
    number | null
  >(null);

  // ─── Load template ───────────────────────────────────────────────────────────

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
          clientId: crypto.randomUUID(),
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
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // ─── Day toggles ─────────────────────────────────────────────────────────────

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

  function updateDayExercises(dayIndex: number, exercises: FormExercise[]) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, exercises } : d)),
    );
  }

  // ─── Save to library ─────────────────────────────────────────────────────────

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

  // ─── Save template ────────────────────────────────────────────────────────────

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

    // Duplicate exercise check within each day
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
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container>
        <Header
          title="Edit Week Plan"
          onBack={() => navigate("/templates?tab=weekly")}
        />
        <div className="container mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-800/50 rounded-xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      </Container>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

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

        {/* ── Plan name ──────────────────────────────────── */}
        <Card className="p-4">
          <Input
            label="Plan Name"
            value={templateName}
            onChange={(v) => setTemplateName(v)}
            placeholder="e.g. Push/Pull/Legs"
          />
        </Card>

        {/* ── Day selector grid ───────────────────────────── */}
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
                  aria-pressed={active}
                  aria-label={day}
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

        {/* ── Day cards ───────────────────────────────────── */}
        {days.map((day, dayIndex) => (
          <Card key={day.name} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-base">{day.name}</h3>
              {day.exercises.length > 0 && (
                <button
                  onClick={() => setSaveToDayLibraryIndex(dayIndex)}
                  aria-label={`Save ${day.name} to library`}
                  className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Save day to library"
                >
                  <BookmarkPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            <DayEditorPanel
              exercises={day.exercises}
              onChange={(exercises) => updateDayExercises(dayIndex, exercises)}
              showImportDay
            />
          </Card>
        ))}

        {/* No days hint */}
        {days.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">
              Select training days above to start building your plan.
            </p>
          </div>
        )}

        {/* Bottom save */}
        {days.length > 0 && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 inline mr-1" />
            {saving ? "Saving…" : "Save Week Plan"}
          </Button>
        )}
      </div>

      {/* ── Save to library confirm ──────────────────────── */}
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
