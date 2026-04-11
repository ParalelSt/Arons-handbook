"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDistinctExerciseNames, getMaxWeightOverTime, getWeeklyVolumes, getPersonalRecords, getWeekComparison } from "@/lib/analyticsService";
import type { ChartDataPoint, WeeklyVolumeSummary, PRSummaryRow, WeekComparison } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [strengthData, setStrengthData] = useState<ChartDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<WeeklyVolumeSummary[]>([]);
  const [prs, setPrs] = useState<PRSummaryRow[]>([]);
  const [comparison, setComparison] = useState<WeekComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      getDistinctExerciseNames(user.id),
      getWeeklyVolumes(user.id),
      getPersonalRecords(user.id),
      getWeekComparison(user.id),
    ]).then(([names, vol, pr, comp]) => {
      setExerciseNames(names);
      setVolumeData(vol);
      setPrs(pr);
      setComparison(comp);
      if (names.length > 0) {
        setSelectedExercise(names[0]);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !selectedExercise) return;
    getMaxWeightOverTime(user.id, selectedExercise).then(setStrengthData).catch(() => setStrengthData([]));
  }, [user, selectedExercise]);

  if (loading) {
    return (
      <div><PageHeader title="Analytics" /><div className="px-4 md:px-6 space-y-4">{[1, 2, 3].map((i) => <div key={i} className="bg-card rounded-xl h-48 animate-pulse border border-primary" />)}</div></div>
    );
  }

  const hasData = exerciseNames.length > 0 || volumeData.length > 0;

  if (!hasData) {
    return (
      <div><PageHeader title="Analytics" /><EmptyState icon={BarChart3} title="No data yet" description="Start logging workouts to see your analytics" /></div>
    );
  }

  const formattedStrength = strengthData.map((d) => ({ ...d, label: format(parseISO(d.date), "MMM d") }));
  const formattedVolume = volumeData.slice(-8).map((v) => ({ ...v, label: format(parseISO(v.weekStart), "MMM d") }));

  return (
    <div>
      <PageHeader title="Analytics" />

      <div className="px-4 md:px-6 space-y-5">
        {/* Week comparison */}
        {comparison && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Volume", value: comparison.volumeChange, suffix: "kg" },
              { label: "Sets", value: comparison.setsChange, suffix: "" },
              { label: "Exercises", value: comparison.exercisesChange, suffix: "" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center py-3">
                <p className="text-xs text-muted mb-1">{stat.label}</p>
                <div className="flex items-center justify-center gap-1">
                  {stat.value > 0 ? <TrendingUp size={14} className="text-success" /> : stat.value < 0 ? <TrendingDown size={14} className="text-danger" /> : null}
                  <span className={`text-lg font-bold ${stat.value > 0 ? "text-success" : stat.value < 0 ? "text-danger" : "text-primary"}`}>
                    {stat.value > 0 ? "+" : ""}{stat.value}{stat.suffix}
                  </span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">vs last week</p>
              </Card>
            ))}
          </div>
        )}

        {/* Strength chart */}
        {exerciseNames.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">Strength Progress</h3>
              <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} className="px-2 py-1 rounded-lg bg-elevated border border-primary text-primary text-xs">
                {exerciseNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {formattedStrength.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formattedStrength} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={40} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface-floating)", border: "1px solid var(--border-primary)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                  <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--accent-primary)" }} name="Max Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted text-sm text-center py-8">No data for this exercise</p>}
          </Card>
        )}

        {/* Volume chart */}
        {formattedVolume.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-primary mb-3">Weekly Volume</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={formattedVolume} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={50} />
                <Tooltip contentStyle={{ backgroundColor: "var(--surface-floating)", border: "1px solid var(--border-primary)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
                <Bar dataKey="totalVolume" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} name="Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* PRs */}
        {prs.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-warning" />
              <h3 className="text-sm font-semibold text-primary">Personal Records</h3>
            </div>
            <div className="space-y-2">
              {prs.map((pr) => (
                <div key={pr.exercise_name} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-primary">{pr.exercise_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{pr.max_weight} kg</Badge>
                    <span className="text-xs text-muted">{format(parseISO(pr.best_date), "MMM d")}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
