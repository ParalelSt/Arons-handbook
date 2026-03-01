import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Toast } from "@/components/ui/Toast";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import {
  getAllWeekTemplates,
  createWeekTemplate,
  deleteWeekTemplate,
  generateWeekFromTemplate,
  getAllDayTemplatesWithWeekNames,
  createWorkoutFromDayTemplate,
} from "@/lib/weekTemplateService";
import type { WeekTemplate } from "@/types";
import type { DayTemplateInfo } from "@/lib/weekTemplateService";
import {
  Plus,
  Edit,
  Trash2,
  CalendarPlus,
  Calendar,
  Play,
  Dumbbell,
} from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";

type Tab = "daily" | "weekly";

export function TemplatesScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab: Tab =
    searchParams.get("tab") === "weekly" ? "weekly" : "daily";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // ─── Daily tab state ─────────────────────────────────────────────────────────

  const [dayTemplates, setDayTemplates] = useState<DayTemplateInfo[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [useDayTarget, setUseDayTarget] = useState<DayTemplateInfo | null>(
    null,
  );
  const [useDayDate, setUseDayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [creatingFromDay, setCreatingFromDay] = useState(false);

  // ─── Weekly tab state ────────────────────────────────────────────────────────

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

  // ─── Shared state ────────────────────────────────────────────────────────────

  const [error, setError] = useState<string>("");
  const [toast, setToast] = useState("");

  // ─── Tab switching ──────────────────────────────────────────────────────────

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSearchParams(tab === "weekly" ? { tab: "weekly" } : {});
  }

  // ─── Load data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    void loadDailyTemplates();
    void loadWeeklyTemplates();
  }, []);

  async function loadDailyTemplates() {
    try {
      setLoadingDaily(true);
      setError("");
      const data = await getAllDayTemplatesWithWeekNames();
      setDayTemplates(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load daily templates";
      setError(msg);
    } finally {
      setLoadingDaily(false);
    }
  }

  async function loadWeeklyTemplates() {
    try {
      setLoadingWeekly(true);
      const data = await getAllWeekTemplates();
      setWeekTemplates(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load weekly plans";
      setError(msg);
    } finally {
      setLoadingWeekly(false);
    }
  }

  // ─── Daily: use a day template ───────────────────────────────────────────────

  async function handleUseDay() {
    if (!useDayTarget) return;
    try {
      setCreatingFromDay(true);
      setError("");
      const workoutId = await createWorkoutFromDayTemplate(
        useDayTarget.id,
        useDayDate,
      );
      setUseDayTarget(null);
      navigate(`/workout/${workoutId}/edit`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create workout";
      setError(msg);
      setCreatingFromDay(false);
    }
  }

  // ─── Weekly: create ──────────────────────────────────────────────────────────

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
      setError(msg);
    } finally {
      setCreatingWeek(false);
    }
  }

  // ─── Weekly: delete ──────────────────────────────────────────────────────────

  async function handleWeekDelete() {
    if (!weekDeleteTarget) return;
    try {
      await deleteWeekTemplate(weekDeleteTarget.id);
      setToast(`"${weekDeleteTarget.name}" deleted`);
      setWeekDeleteTarget(null);
      await loadWeeklyTemplates();
      await loadDailyTemplates(); // days also change
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete template";
      setError(msg);
      setWeekDeleteTarget(null);
    }
  }

  // ─── Weekly: generate week ───────────────────────────────────────────────────

  async function handleWeekGenerate() {
    if (!weekGenerateTarget) return;
    try {
      setGeneratingWeek(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error: dbErr } = await supabase
        .from("workouts")
        .select("date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1);
      if (dbErr) throw dbErr;
      let weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      if (data && data.length > 0 && data[0].date) {
        const lastWeekStart = startOfWeek(new Date(data[0].date), {
          weekStartsOn: 1,
        });
        const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        if (lastWeekStart.getTime() === thisWeekStart.getTime()) {
          weekStartDate = new Date(thisWeekStart);
          weekStartDate.setDate(weekStartDate.getDate() + 7);
        }
      }
      const ids = await generateWeekFromTemplate(
        weekGenerateTarget.id,
        weekStartDate,
      );
      setWeekGenerateTarget(null);
      setToast(
        `Created ${ids.length} workout${ids.length !== 1 ? "s" : ""} for the week of ${format(weekStartDate, "MMM d")}`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to generate week";
      setError(msg);
      setWeekGenerateTarget(null);
    } finally {
      setGeneratingWeek(false);
    }
  }

  // ─── Group daily templates by week template ──────────────────────────────────

  const daysByWeek = dayTemplates.reduce<
    { weekName: string; weekId: string; days: DayTemplateInfo[] }[]
  >((acc, day) => {
    const existing = acc.find((g) => g.weekId === day.weekTemplateId);
    if (existing) {
      existing.days.push(day);
    } else {
      acc.push({
        weekName: day.weekTemplateName,
        weekId: day.weekTemplateId,
        days: [day],
      });
    }
    return acc;
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Container>
      <Header
        title="Templates"
        onBack={() => navigate("/")}
        action={
          activeTab === "weekly" ? (
            <Button onClick={() => setShowWeekCreate(true)}>
              <Plus className="w-4 h-4 inline mr-1" />
              New
            </Button>
          ) : undefined
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Templates" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* ── Tab bar ── */}
        <div className="flex gap-1 bg-card rounded-lg p-1 mb-5">
          <button
            onClick={() => switchTab("daily")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "daily"
                ? "bg-accent-primary text-primary"
                : "text-secondary hover:text-primary"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => switchTab("weekly")}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "weekly"
                ? "bg-accent-primary text-primary"
                : "text-secondary hover:text-primary"
            }`}
          >
            Weekly
          </button>
        </div>

        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* ════════════════ DAILY TAB ════════════════ */}
        {activeTab === "daily" && (
          <div className="space-y-5">
            {loadingDaily && <SkeletonList count={3} lines={3} />}

            {!loadingDaily && dayTemplates.length === 0 && (
              <div className="text-center py-16 px-4">
                <Dumbbell className="w-12 h-12 text-muted mx-auto mb-4" />
                <h2 className="text-xl text-primary mb-2">No Daily Templates</h2>
                <p className="text-secondary mb-6 max-w-sm mx-auto">
                  Daily templates come from your weekly plans. Create a weekly
                  plan and add training days to see them here.
                </p>
                <Button onClick={() => switchTab("weekly")}>
                  Go to Weekly Plans
                </Button>
              </div>
            )}

            {!loadingDaily &&
              daysByWeek.map((group) => (
                <div key={group.weekId}>
                  {/* Week group header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      {group.weekName}
                    </p>
                    <button
                      onClick={() =>
                        navigate(`/week-templates/${group.weekId}/edit`)
                      }
                      className="text-xs text-muted hover:text-secondary transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit plan
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.days.map((day) => (
                      <Card key={day.id} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-primary font-semibold">
                              {day.name}
                            </h3>
                            <p className="text-muted text-xs mt-0.5">
                              {day.exercises.length} exercise
                              {day.exercises.length !== 1 ? "s" : ""}
                              {day.exercises.length > 0 && (
                                <span className="text-muted">
                                  {" "}
                                  ·{" "}
                                  {day.exercises
                                    .slice(0, 3)
                                    .map((e) => e.name)
                                    .join(", ")}
                                  {day.exercises.length > 3 && "…"}
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setUseDayTarget(day);
                              setUseDayDate(format(new Date(), "yyyy-MM-dd"));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-accent-primary hover:bg-accent text-primary"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Use
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ════════════════ WEEKLY TAB ════════════════ */}
        {activeTab === "weekly" && (
          <div className="space-y-4">
            {/* Inline create form */}
            {showWeekCreate && (
              <Card className="p-4">
                <h3 className="text-primary font-semibold mb-3">
                  New Weekly Plan
                </h3>
                <div className="flex gap-2">
                  <input
                    value={newWeekName}
                    onChange={(e) => setNewWeekName(e.target.value)}
                    placeholder="Plan name (e.g. Push/Pull/Legs)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleWeekCreate();
                    }}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-(--border-focus)"
                  />
                  <Button
                    onClick={handleWeekCreate}
                    disabled={creatingWeek || !newWeekName.trim()}
                  >
                    {creatingWeek ? "…" : "Create"}
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

            {loadingWeekly && <SkeletonList count={3} lines={2} />}

            {!loadingWeekly && weekTemplates.length === 0 && (
              <div className="text-center py-16 px-4">
                <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
                <h2 className="text-xl text-primary mb-2">No Weekly Plans Yet</h2>
                <p className="text-secondary mb-6 max-w-sm mx-auto">
                  Create a weekly plan to organise your training days. Each day
                  you add will also appear in the Daily tab.
                </p>
                <Button onClick={() => setShowWeekCreate(true)}>
                  <Plus className="w-4 h-4 inline mr-1" />
                  Create Your First Plan
                </Button>
              </div>
            )}

            {!loadingWeekly &&
              weekTemplates.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-primary font-semibold truncate">
                        {t.name}
                      </h3>
                      <p className="text-muted text-xs mt-1">
                        Created {format(new Date(t.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => setWeekGenerateTarget(t)}
                        className="p-2 text-success hover:bg-success-surface rounded-lg transition-colors"
                        title="Generate week"
                      >
                        <CalendarPlus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/week-templates/${t.id}/edit`)
                        }
                        className="p-2 text-accent hover:bg-accent-soft rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setWeekDeleteTarget(t)}
                        className="p-2 text-danger hover:bg-danger-surface rounded-lg transition-colors"
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

      {/* ── Use Day modal ── */}
      {useDayTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card rounded-2xl border border-primary p-5 space-y-4">
            <div>
              <h2 className="text-primary font-bold text-lg">
                {useDayTarget.name}
              </h2>
              <p className="text-secondary text-sm">
                {useDayTarget.weekTemplateName} ·{" "}
                {useDayTarget.exercises.length} exercise
                {useDayTarget.exercises.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <label className="block text-secondary text-xs mb-1.5">
                Workout date
              </label>
              <input
                type="date"
                value={useDayDate}
                onChange={(e) => setUseDayDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none focus:ring-2 focus:ring-(--border-focus)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setUseDayTarget(null)}
                disabled={creatingFromDay}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUseDay}
                disabled={creatingFromDay || !useDayDate}
              >
                {creatingFromDay ? "Creating…" : "Start Workout"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete weekly plan ── */}
      <ConfirmDialog
        isOpen={!!weekDeleteTarget}
        title="Delete Weekly Plan"
        message={`Delete "${weekDeleteTarget?.name}"? All days in this plan will also be removed from the Daily tab. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleWeekDelete}
        onCancel={() => setWeekDeleteTarget(null)}
      />

      {/* ── Generate week ── */}
      <ConfirmDialog
        isOpen={!!weekGenerateTarget}
        title="Generate This Week"
        message={`This will create workouts for the current (or next) week from "${weekGenerateTarget?.name}". Continue?`}
        confirmLabel={generatingWeek ? "Generating…" : "Generate"}
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={handleWeekGenerate}
        onCancel={() => setWeekGenerateTarget(null)}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </Container>
  );
}
