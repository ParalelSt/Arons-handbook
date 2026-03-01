import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  getAuthUserId,
  getDistinctExerciseNames,
  getMaxWeightOverTime,
  getWeeklyVolumes,
  getPersonalRecords,
  getWeekComparison,
} from "@/lib/analyticsService";
import { goalApi } from "@/lib/api";
import type {
  ChartDataPoint,
  WeeklyVolumeSummary,
  WeekComparison,
  PRSummaryRow,
  ExerciseGoal,
} from "@/types";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  BarChart3,
} from "lucide-react";

export function AnalyticsScreen() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [strengthData, setStrengthData] = useState<ChartDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<WeeklyVolumeSummary[]>([]);
  const [prs, setPrs] = useState<PRSummaryRow[]>([]);
  const [goals, setGoals] = useState<ExerciseGoal[]>([]);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // ─── Initial data load ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const uid = await getAuthUserId();
        if (cancelled) return;
        setUserId(uid);

        const [names, volumes, records, comparison, goalsData] =
          await Promise.all([
            getDistinctExerciseNames(uid),
            getWeeklyVolumes(uid),
            getPersonalRecords(uid),
            getWeekComparison(uid),
            goalApi.getAll(),
          ]);

        if (cancelled) return;

        setExerciseNames(names);
        setVolumeData(volumes);
        setPrs(records);
        setWeekComparison(comparison);
        setGoals(goalsData);

        if (names.length > 0) {
          setSelectedExercise(names[0]);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load analytics";
        console.error("[AnalyticsScreen] loadInitialData error:", err);
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Strength chart data (re-loads when exercise changes) ───────────────────

  const loadStrengthData = useCallback(
    async (name: string) => {
      if (!name || !userId) return;
      try {
        const data = await getMaxWeightOverTime(userId, name);
        setStrengthData(data);
      } catch (err) {
        console.error("[AnalyticsScreen] loadStrengthData error:", err);
        setStrengthData([]);
      }
    },
    [userId],
  );

  useEffect(() => {
    if (selectedExercise && userId) {
      loadStrengthData(selectedExercise);
    }
  }, [selectedExercise, userId, loadStrengthData]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function formatChartDate(dateStr: string): string {
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  }

  function TrendIcon({ value }: { value: number }) {
    if (value > 0)
      return <TrendingUp className="w-4 h-4 text-success inline" />;
    if (value < 0)
      return <TrendingDown className="w-4 h-4 text-danger inline" />;
    return <Minus className="w-4 h-4 text-muted inline" />;
  }

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container>
        <Header title="Analytics" onBack={() => navigate("/")} />
        <div className="text-center py-12">
          <div className="text-muted">Loading analytics...</div>
        </div>
      </Container>
    );
  }

  // ─── Empty state: no data at all ────────────────────────────────────────────

  const hasAnyData =
    exerciseNames.length > 0 || volumeData.length > 0 || prs.length > 0;

  if (!hasAnyData && !error) {
    return (
      <Container>
        <Header title="Analytics" onBack={() => navigate("/")} />
        <Breadcrumbs
          items={[
            { label: "Home", onClick: () => navigate("/") },
            { label: "Analytics" },
          ]}
        />
        <div className="text-center py-16 px-4">
          <BarChart3 className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="text-xl text-primary mb-2">No workout data yet</h2>
          <p className="text-muted mb-6 max-w-sm mx-auto">
            Log some workouts to see your strength progress, volume trends, and
            personal records here.
          </p>
          <Button onClick={() => navigate("/workout/new")}>
            Log Your First Workout
          </Button>
        </div>
      </Container>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <Container>
      <Header title="Analytics" onBack={() => navigate("/")} />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Analytics" },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {error && (
          <ErrorMessage message={error} onDismiss={() => setError("")} />
        )}

        {/* ─── Strength Progress ─────────────────────────────── */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">
              Strength Progress
            </h2>
          </div>

          {exerciseNames.length > 0 ? (
            <>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-(--border-focus) focus:border-transparent"
              >
                {exerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {strengthData.length > 1 ? (
                <div className="h-52 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={strengthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 11 }}
                        unit="kg"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface-floating)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                        }}
                        labelFormatter={(label) =>
                          formatChartDate(String(label))
                        }
                        formatter={(value) => [`${value} kg`, "Max Weight"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        dot={{ fill: "var(--accent-primary)", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted text-sm text-center py-8">
                  Not enough data for this exercise yet.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted text-sm text-center py-8">
              Log some workouts to see strength progress.
            </p>
          )}
        </Card>

        {/* ─── Volume Trends ─────────────────────────────────── */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">Volume Trends</h2>
          </div>

          {volumeData.length > 1 ? (
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={formatChartDate}
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface-floating)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                    labelFormatter={(label) => formatChartDate(String(label))}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} kg`,
                      "Total Volume",
                    ]}
                  />
                  <Bar
                    dataKey="totalVolume"
                    fill="var(--accent-primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-8">
              Log workouts across multiple weeks to see volume trends.
            </p>
          )}
        </Card>

        {/* ─── Weekly Comparison ──────────────────────────────── */}
        {weekComparison && (
          <Card className="p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-primary mb-4">
              Weekly Comparison
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-muted text-xs mb-1">Volume</p>
                <p className="text-primary font-semibold text-sm">
                  {weekComparison.current.totalVolume.toLocaleString()} kg
                </p>
                <p className="text-xs mt-1">
                  <TrendIcon value={weekComparison.volumeChange} />{" "}
                  <span
                    className={
                      weekComparison.volumeChange >= 0
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    {weekComparison.volumeChange >= 0 ? "+" : ""}
                    {weekComparison.volumeChange.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted text-xs mb-1">Sets</p>
                <p className="text-primary font-semibold text-sm">
                  {weekComparison.current.totalSets}
                </p>
                <p className="text-xs mt-1">
                  <TrendIcon value={weekComparison.setsChange} />{" "}
                  <span
                    className={
                      weekComparison.setsChange >= 0
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    {weekComparison.setsChange >= 0 ? "+" : ""}
                    {weekComparison.setsChange}
                  </span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted text-xs mb-1">Exercises</p>
                <p className="text-primary font-semibold text-sm">
                  {weekComparison.current.totalExercises}
                </p>
                <p className="text-xs mt-1">
                  <TrendIcon value={weekComparison.exercisesChange} />{" "}
                  <span
                    className={
                      weekComparison.exercisesChange >= 0
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    {weekComparison.exercisesChange >= 0 ? "+" : ""}
                    {weekComparison.exercisesChange}
                  </span>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ─── Goal Progress & Personal Records ────────────── */}
        {(() => {
          // Match goals (with target_weight) to PR data
          const goalsWithTargetWeight = goals.filter(
            (g) => g.target_weight && g.exercise?.name,
          );
          const goalExerciseNames = new Set(
            goalsWithTargetWeight.map((g) => g.exercise!.name),
          );
          const prsWithoutGoals = prs.filter(
            (pr) => !goalExerciseNames.has(pr.exercise_name),
          );

          return (
            <>
              {/* Goal Progress Section */}
              {goalsWithTargetWeight.length > 0 && (
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold text-primary">
                      Goal Progress
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {goalsWithTargetWeight.map((goal) => {
                      const exerciseName = goal.exercise!.name;
                      const matchingPR = prs.find(
                        (pr) => pr.exercise_name === exerciseName,
                      );
                      const currentBest = matchingPR?.max_weight ?? 0;
                      const target = goal.target_weight!;
                      const pct = Math.min(
                        Math.round((currentBest / target) * 100),
                        100,
                      );
                      const achieved = currentBest >= target;

                      return (
                        <div
                          key={goal.id}
                          className={`rounded-lg p-3 ${
                            achieved
                              ? "bg-elevated border border-primary"
                              : "bg-elevated"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {achieved && (
                                <Trophy className="w-4 h-4 text-warning" />
                              )}
                              <p className="text-primary font-medium text-sm">
                                {exerciseName}
                              </p>
                            </div>
                            <p className="text-sm">
                              <span
                                className={
                                  achieved
                                    ? "text-warning font-semibold"
                                    : "text-primary"
                                }
                              >
                                {currentBest} kg
                              </span>
                              <span className="text-muted">
                                {" "}
                                / {target} kg
                              </span>
                            </p>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                achieved
                                  ? "bg-warning"
                                  : pct >= 75
                                    ? "bg-success"
                                    : pct >= 50
                                      ? "bg-accent-primary"
                                      : "bg-muted"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <p className="text-xs text-muted">
                              {achieved ? "Goal reached!" : `${pct}% of target`}
                            </p>
                            {matchingPR && (
                              <p className="text-xs text-muted">
                                PR:{" "}
                                {format(
                                  parseISO(matchingPR.best_date),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Other Personal Records (no goal set) */}
              <Card className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-warning" />
                  <h2 className="text-lg font-semibold text-primary">
                    Personal Records
                  </h2>
                </div>

                {prsWithoutGoals.length > 0 ? (
                  <div className="space-y-2">
                    {prsWithoutGoals.slice(0, 20).map((pr) => (
                      <div
                        key={pr.exercise_name}
                        className="flex items-center justify-between bg-elevated rounded-lg p-3"
                      >
                        <div>
                          <p className="text-primary font-medium text-sm">
                            {pr.exercise_name}
                          </p>
                          <p className="text-muted text-xs">
                            {format(parseISO(pr.best_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-warning font-semibold text-sm">
                            {pr.max_weight} kg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : prs.length > 0 ? (
                  <p className="text-muted text-sm text-center py-4">
                    All your records are tracked under Goal Progress above!
                  </p>
                ) : (
                  <p className="text-muted text-sm text-center py-8">
                    No personal records yet. Keep training!
                  </p>
                )}
              </Card>
            </>
          );
        })()}

        {/* Back button */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </div>
    </Container>
  );
}
