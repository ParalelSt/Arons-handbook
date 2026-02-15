import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import {
  getMaxWeightOverTime,
  getWeeklyVolumes,
  getAllPRs,
  getWeekComparison,
  getDistinctExerciseNames,
} from "@/lib/analytics";
import type {
  ChartDataPoint,
  WeeklyVolumeSummary,
  PersonalRecord,
  WeekComparison,
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
  BarChart3,
} from "lucide-react";

export function AnalyticsScreen() {
  const navigate = useNavigate();
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [strengthData, setStrengthData] = useState<ChartDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<WeeklyVolumeSummary[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [weekComparison, setWeekComparison] = useState<WeekComparison | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [names, volumes, records, comparison] = await Promise.all([
        getDistinctExerciseNames(),
        getWeeklyVolumes(12),
        getAllPRs(),
        getWeekComparison(),
      ]);

      setExerciseNames(names);
      setVolumeData(volumes);
      setPrs(records);
      setWeekComparison(comparison);

      if (names.length > 0) {
        setSelectedExercise(names[0]);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const loadStrengthData = useCallback(async (name: string) => {
    if (!name) return;
    try {
      const data = await getMaxWeightOverTime(name);
      setStrengthData(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      loadStrengthData(selectedExercise);
    }
  }, [selectedExercise, loadStrengthData]);

  function formatChartDate(dateStr: string): string {
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  }

  function TrendIcon({ value }: { value: number }) {
    if (value > 0)
      return <TrendingUp className="w-4 h-4 text-green-400 inline" />;
    if (value < 0)
      return <TrendingDown className="w-4 h-4 text-red-400 inline" />;
    return <Minus className="w-4 h-4 text-slate-400 inline" />;
  }

  if (loading) {
    return (
      <Container>
        <Header title="Analytics" onBack={() => navigate("/")} />
        <div className="text-center py-12">
          <div className="text-slate-400">Loading analytics...</div>
        </div>
      </Container>
    );
  }

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
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">
              Strength Progress
            </h2>
          </div>

          {exerciseNames.length > 0 ? (
            <>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        unit="kg"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                          color: "#fff",
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
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">
                  Not enough data for this exercise yet.
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Log some workouts to see strength progress.
            </p>
          )}
        </Card>

        {/* ─── Volume Trends ─────────────────────────────────── */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Volume Trends</h2>
          </div>

          {volumeData.length > 1 ? (
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="weekStart"
                    tickFormatter={formatChartDate}
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#fff",
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
                    fill="#a855f7"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Log workouts across multiple weeks to see volume trends.
            </p>
          )}
        </Card>

        {/* ─── Weekly Comparison ──────────────────────────────── */}
        {weekComparison && (
          <Card className="p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-white mb-4">
              Weekly Comparison
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-slate-500 text-xs mb-1">Volume</p>
                <p className="text-white font-semibold text-sm">
                  {weekComparison.current.totalVolume.toLocaleString()} kg
                </p>
                <p className="text-xs mt-1">
                  <TrendIcon value={weekComparison.volumeChange} />{" "}
                  <span
                    className={
                      weekComparison.volumeChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {weekComparison.volumeChange >= 0 ? "+" : ""}
                    {weekComparison.volumeChange.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-xs mb-1">Sets</p>
                <p className="text-white font-semibold text-sm">
                  {weekComparison.current.totalSets}
                </p>
                <p className="text-xs mt-1">
                  <TrendIcon value={weekComparison.setsChange} />{" "}
                  <span
                    className={
                      weekComparison.setsChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {weekComparison.setsChange >= 0 ? "+" : ""}
                    {weekComparison.setsChange}
                  </span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 text-xs mb-1">Exercises</p>
                <p className="text-white font-semibold text-sm">
                  {weekComparison.current.totalExercises}
                </p>
                <p className="text-xs mt-1">
                  <TrendIcon value={weekComparison.exercisesChange} />{" "}
                  <span
                    className={
                      weekComparison.exercisesChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
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

        {/* ─── PR Timeline ───────────────────────────────────── */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              Personal Records
            </h2>
          </div>

          {prs.length > 0 ? (
            <div className="space-y-2">
              {prs.slice(0, 20).map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3"
                >
                  <div>
                    <p className="text-white font-medium text-sm">
                      {pr.exercise_name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {format(parseISO(pr.date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-semibold text-sm">
                      {pr.weight} kg
                    </p>
                    <p className="text-slate-500 text-xs">{pr.reps} reps</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              No personal records yet. Keep training!
            </p>
          )}
        </Card>

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
