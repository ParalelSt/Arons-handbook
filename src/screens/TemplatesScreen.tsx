import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Modal, Input } from "@/components/ui/Form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Toast } from "@/components/ui/Toast";
import { templateApi } from "@/lib/templates";
import {
  getAllWeekTemplates,
  createWeekTemplate,
  deleteWeekTemplate,
  generateWeekFromTemplate,
} from "@/lib/weekTemplateService";
import type { WorkoutTemplateWithExercises, WeekTemplate } from "@/types";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  Play,
  CalendarPlus,
  Calendar,
} from "lucide-react";
import { format, startOfWeek } from "date-fns";

type Tab = "workout" | "weekly";

export function TemplatesScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "weekly" ? "weekly" : "workout";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // ─── Workout Templates state ────────────────────────────────────────────────

  const [templates, setTemplates] = useState<WorkoutTemplateWithExercises[]>(
    [],
  );
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkoutTemplateWithExercises | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyName, setCopyName] = useState("");
  const [showUseModal, setShowUseModal] = useState(false);
  const [workoutDate, setWorkoutDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [deleteConfirm, setDeleteConfirm] =
    useState<WorkoutTemplateWithExercises | null>(null);

  // ─── Weekly Templates state ─────────────────────────────────────────────────

  const [weekTemplates, setWeekTemplates] = useState<WeekTemplate[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [showWeekCreate, setShowWeekCreate] = useState(false);
  const [newWeekName, setNewWeekName] = useState("");
  const [creatingWeek, setCreatingWeek] = useState(false);
  const [weekDeleteTarget, setWeekDeleteTarget] = useState<WeekTemplate | null>(
    null,
  );
  const [weekGenerateTarget, setWeekGenerateTarget] =
    useState<WeekTemplate | null>(null);
  const [generatingWeek, setGeneratingWeek] = useState(false);
  const [toast, setToast] = useState("");

  // ─── Tab switching ──────────────────────────────────────────────────────────

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearchParams(tab === "weekly" ? { tab: "weekly" } : {});
  }

  // ─── Load Workout Templates ─────────────────────────────────────────────────

  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  async function loadWorkoutTemplates() {
    try {
      setLoadingWorkout(true);
      setError("");
      const data = await templateApi.getAll();
      setTemplates(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load templates. Make sure you've run the templates migration in Supabase.";
      console.error(err);
      setError(msg);
    } finally {
      setLoadingWorkout(false);
    }
  }

  // ─── Load Weekly Templates ──────────────────────────────────────────────────

  useEffect(() => {
    loadWeeklyTemplates();
  }, []);

  async function loadWeeklyTemplates() {
    try {
      setLoadingWeekly(true);
      const data = await getAllWeekTemplates();
      setWeekTemplates(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load weekly templates";
      console.error("[TemplatesScreen] loadWeeklyTemplates error:", err);
      setError(msg);
    } finally {
      setLoadingWeekly(false);
    }
  }

  // ─── Workout Template actions ───────────────────────────────────────────────

  async function handleCopy() {
    if (!selectedTemplate || !copyName.trim()) return;
    try {
      setError("");
      await templateApi.copy(selectedTemplate.id, copyName.trim());
      setShowCopyModal(false);
      setCopyName("");
      setSelectedTemplate(null);
      loadWorkoutTemplates();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to copy template";
      console.error(err);
      setError(msg);
    }
  }

  async function handleDeleteWorkout() {
    if (!deleteConfirm) return;
    try {
      setError("");
      await templateApi.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      loadWorkoutTemplates();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete template";
      console.error(err);
      setError(msg);
      setDeleteConfirm(null);
    }
  }

  async function handleUseTemplate() {
    if (!selectedTemplate) return;
    try {
      setError("");
      const workoutId = await templateApi.createWorkoutFromTemplate(
        selectedTemplate.id,
        workoutDate,
      );
      navigate(`/workout/${workoutId}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create workout from template.";
      console.error(err);
      setError(msg);
    }
  }

  // ─── Weekly Template actions ────────────────────────────────────────────────

  async function handleWeekCreate() {
    if (!newWeekName.trim()) return;
    try {
      setCreatingWeek(true);
      const created = await createWeekTemplate(newWeekName.trim());
      setNewWeekName("");
      setShowWeekCreate(false);
      navigate(`/week-templates/${created.id}/edit`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create template";
      console.error("[TemplatesScreen] week create error:", err);
      setError(msg);
    } finally {
      setCreatingWeek(false);
    }
  }

  async function handleWeekDelete() {
    if (!weekDeleteTarget) return;
    try {
      await deleteWeekTemplate(weekDeleteTarget.id);
      setToast(`"${weekDeleteTarget.name}" deleted`);
      setWeekDeleteTarget(null);
      await loadWeeklyTemplates();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete template";
      console.error("[TemplatesScreen] week delete error:", err);
      setError(msg);
      setWeekDeleteTarget(null);
    }
  }

  async function handleWeekGenerate() {
    if (!weekGenerateTarget) return;
    try {
      setGeneratingWeek(true);
      const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
      const ids = await generateWeekFromTemplate(weekGenerateTarget.id, monday);
      setWeekGenerateTarget(null);
      setToast(
        `Created ${ids.length} workout${ids.length !== 1 ? "s" : ""} for the week of ${format(monday, "MMM d")}`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate week";
      console.error("[TemplatesScreen] generate error:", err);
      setError(msg);
      setWeekGenerateTarget(null);
    } finally {
      setGeneratingWeek(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container>
      <Header
        title="Templates"
        onBack={() => navigate("/")}
        action={
          activeTab === "workout" ? (
            <Button onClick={() => navigate("/templates/new")}>
              <Plus className="w-5 h-5" />
            </Button>
          ) : (
            <Button onClick={() => setShowWeekCreate(true)}>
              <Plus className="w-4 h-4 inline mr-1" />
              New
            </Button>
          )
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Templates" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 mb-5">
          <button
            onClick={() => switchTab("workout")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "workout"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Workout
          </button>
          <button
            onClick={() => switchTab("weekly")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "weekly"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Weekly
          </button>
        </div>

        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* ═══════════════ WORKOUT TEMPLATES TAB ═══════════════ */}
        {activeTab === "workout" && (
          <>
            {loadingWorkout && (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading templates...</div>
              </div>
            )}

            {!loadingWorkout && templates.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-2xl text-white mb-2">No Templates Yet</h2>
                <p className="text-slate-400 mb-6">
                  Create templates for your regular workouts
                </p>
                <Button onClick={() => navigate("/templates/new")}>
                  <Plus className="w-5 h-5 inline mr-2" />
                  Create Template
                </Button>
              </div>
            )}

            {!loadingWorkout && templates.length > 0 && (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-slate-400 text-sm mb-2">
                            {template.description}
                          </p>
                        )}
                        <p className="text-slate-500 text-xs">
                          {template.template_exercises.length} exercise
                          {template.template_exercises.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Exercise list */}
                    <div className="space-y-1 mb-4 pl-3 border-l-2 border-slate-700">
                      {template.template_exercises.map((te) => (
                        <div key={te.id} className="text-sm">
                          <span className="text-slate-300">
                            {te.exercise?.name}
                          </span>
                          <span className="text-slate-600 ml-2">
                            {te.target_sets} sets
                            {te.target_reps && ` × ${te.target_reps} reps`}
                            {te.target_weight && ` × ${te.target_weight}kg`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowUseModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Use
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setCopyName(`${template.name} (Copy)`);
                          setShowCopyModal(true);
                        }}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/templates/${template.id}/edit`)
                        }
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(template)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════ WEEKLY TEMPLATES TAB ═══════════════ */}
        {activeTab === "weekly" && (
          <div className="space-y-4">
            {/* Inline Create Form */}
            {showWeekCreate && (
              <Card className="p-4">
                <h3 className="text-white font-semibold mb-3">
                  New Weekly Plan
                </h3>
                <div className="flex gap-2">
                  <input
                    value={newWeekName}
                    onChange={(e) => setNewWeekName(e.target.value)}
                    placeholder="Plan name (e.g. Push/Pull/Legs)"
                    onKeyDown={(e) => e.key === "Enter" && handleWeekCreate()}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleWeekCreate}
                    disabled={creatingWeek || !newWeekName.trim()}
                  >
                    {creatingWeek ? "..." : "Create"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowWeekCreate(false);
                      setNewWeekName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Loading */}
            {loadingWeekly && (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading weekly plans...</div>
              </div>
            )}

            {/* Empty state */}
            {!loadingWeekly && weekTemplates.length === 0 && (
              <div className="text-center py-16 px-4">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h2 className="text-xl text-white mb-2">No Weekly Plans Yet</h2>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Create a weekly template to plan your training days,
                  exercises, and sets — then generate a full week of workouts
                  from it.
                </p>
                <Button onClick={() => setShowWeekCreate(true)}>
                  <Plus className="w-4 h-4 inline mr-1" />
                  Create Your First Plan
                </Button>
              </div>
            )}

            {/* List */}
            {!loadingWeekly &&
              weekTemplates.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {t.name}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        Created {format(new Date(t.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => setWeekGenerateTarget(t)}
                        className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Generate week"
                      >
                        <CalendarPlus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/week-templates/${t.id}/edit`)}
                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setWeekDeleteTarget(t)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* ─── Modals ───────────────────────────────────────────── */}

      {/* Copy Workout Template Modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setSelectedTemplate(null);
          setCopyName("");
        }}
        title="Copy Template"
      >
        <div className="space-y-4">
          <Input
            label="New Template Name"
            value={copyName}
            onChange={setCopyName}
            placeholder="e.g., Push Day v2"
            required
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCopyModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!copyName.trim()}
              className="flex-1"
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>

      {/* Use Workout Template Modal */}
      <Modal
        isOpen={showUseModal}
        onClose={() => {
          setShowUseModal(false);
          setSelectedTemplate(null);
        }}
        title="Start Workout"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Create a new workout from &quot;{selectedTemplate?.name}&quot;
          </p>
          <Input
            label="Workout Date"
            type="date"
            value={workoutDate}
            onChange={setWorkoutDate}
            required
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowUseModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} className="flex-1">
              Start Workout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Workout Template */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteWorkout}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Delete Weekly Template */}
      <ConfirmDialog
        isOpen={!!weekDeleteTarget}
        title="Delete Weekly Plan"
        message={`Delete "${weekDeleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleWeekDelete}
        onCancel={() => setWeekDeleteTarget(null)}
      />

      {/* Generate Week Confirmation */}
      <ConfirmDialog
        isOpen={!!weekGenerateTarget}
        title="Generate This Week"
        message={`This will create workouts for the current week from "${weekGenerateTarget?.name}". Continue?`}
        confirmLabel={generatingWeek ? "Generating..." : "Generate"}
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={handleWeekGenerate}
        onCancel={() => setWeekGenerateTarget(null)}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </Container>
  );
}
