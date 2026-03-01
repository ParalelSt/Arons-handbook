import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Input, TextArea } from "@/components/ui/Form";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { DayEditorPanel } from "@/components/ui/DayEditorPanel";
import { workoutApi, workoutExerciseApi } from "@/lib/api";
import { templateApi } from "@/lib/templates";
import type { FormExercise, WorkoutTemplateWithExercises } from "@/types";
import { format, parseISO } from "date-fns";

// Use a versioned key so old incompatible drafts are ignored
const DRAFT_KEY = "workout-draft-v2";

export function AddWorkoutScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetDate = searchParams.get("date");
  const presetWeekStart = searchParams.get("weekStart");

  const [date, setDate] = useState(
    presetDate || format(new Date(), "yyyy-MM-dd"),
  );
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [formExercises, setFormExercises] = useState<FormExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [templates, setTemplates] = useState<WorkoutTemplateWithExercises[]>(
    [],
  );
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(
    null,
  );

  // ─── Load draft + templates on mount ─────────────────────────────────────────

  useEffect(() => {
    loadTemplates();
    if (!presetDate) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            date?: string;
            title?: string;
            notes?: string;
            formExercises?: FormExercise[];
          };
          if (parsed.date) setDate(parsed.date);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.formExercises) setFormExercises(parsed.formExercises);
        }
      } catch {
        // Silently ignore malformed draft
      }
    }
  }, []);

  // ─── Auto-save draft ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (title || notes || formExercises.length > 0) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ date, title, notes, formExercises }),
      );
    }
  }, [date, title, notes, formExercises]);

  async function loadTemplates() {
    try {
      const data = await templateApi.getAll();
      setTemplates(data);
    } catch {
      // Non-critical
    }
  }

  // ─── Template quick-start ─────────────────────────────────────────────────────

  async function useTemplate(template: WorkoutTemplateWithExercises) {
    try {
      setError("");
      setLoadingTemplateId(template.id);
      const workoutId = await templateApi.createWorkoutFromTemplate(
        template.id,
        date,
        template.name,
      );
      navigate(`/workout/${workoutId}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create workout from template";
      setError(msg);
      setLoadingTemplateId(null);
    }
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    const validExercises = formExercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      setError("Add at least one exercise.");
      return;
    }
    for (const ex of validExercises) {
      if (ex.sets.length === 0) {
        setError(`"${ex.name}" has no sets. Add at least one set.`);
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      // Create the workout shell (no exercises yet)
      const created = await workoutApi.create({
        date,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        exercises: [],
      });
      // Add exercises via saveAll (handles name→ID resolution)
      await workoutExerciseApi.saveAll(created.id, validExercises);
      localStorage.removeItem(DRAFT_KEY);
      navigate(presetWeekStart ? `/week/${presetWeekStart}` : "/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save workout";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void handleSave();
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const dayName = date ? format(parseISO(date), "EEEE") : "";

  const breadcrumbs = presetWeekStart
    ? [
        { label: "Home", onClick: () => navigate("/") },
        { label: "Week", onClick: () => navigate(`/week/${presetWeekStart}`) },
        { label: "New Workout" },
      ]
    : [
        { label: "Home", onClick: () => navigate("/") },
        { label: "New Workout" },
      ];

  return (
    <Container>
      <Header
        title="New Workout"
        onBack={() => navigate(-1)}
        action={
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />
      <Breadcrumbs items={breadcrumbs} />

      <form onSubmit={handleSubmit}>
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
          {error && (
            <ErrorMessage message={error} onDismiss={() => setError("")} />
          )}

          {/* ── Template quick-start ── */}
          {templates.length > 0 && formExercises.length === 0 && (
            <Card className="p-4">
              <p className="text-sm font-medium text-secondary mb-3">
                Quick start from a template
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => useTemplate(t)}
                    disabled={loadingTemplateId !== null}
                    className={`text-left p-3 rounded-lg border transition-all text-sm ${
                      loadingTemplateId === t.id
                        ? "bg-accent-primary border-accent opacity-90"
                        : "bg-accent-soft border-accent hover:bg-accent-soft hover:border-accent"
                    } ${
                      loadingTemplateId !== null && loadingTemplateId !== t.id
                        ? "opacity-40"
                        : ""
                    }`}
                  >
                    <p className="font-medium text-primary">{t.name}</p>
                    <p className="text-secondary text-xs mt-0.5">
                      {t.template_exercises.length} exercise
                      {t.template_exercises.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ── Basic info ── */}
          <Card className="p-4 space-y-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={setDate}
              required
            />
            <Input
              label="Title (optional)"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Push Day, Leg Day"
            />
            <TextArea
              label="Notes (optional)"
              value={notes}
              onChange={setNotes}
              placeholder="Any notes about this workout…"
            />
          </Card>

          {/* ── Day card — same structure as EditWeekTemplateScreen ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-primary font-semibold text-base">
                {dayName || "Exercises"}
              </h3>
            </div>
            <DayEditorPanel
              exercises={formExercises}
              onChange={setFormExercises}
              showImportDay
            />
          </Card>

          {/* ── Bottom save ── */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving…" : "Save Workout"}
          </Button>

          {(title || notes || formExercises.length > 0) && (
            <p className="text-xs text-muted text-center">
              Draft saved automatically
            </p>
          )}
        </div>
      </form>
    </Container>
  );
}
