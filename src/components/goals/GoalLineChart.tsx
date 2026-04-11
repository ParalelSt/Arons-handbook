"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { getMaxWeightOverTime } from "@/lib/analyticsService";
import { useAuth } from "@/hooks/useAuth";
import type { ChartDataPoint } from "@/types";
import { format, parseISO } from "date-fns";

interface GoalLineChartProps {
  exerciseName: string;
  targetWeight?: number;
}

export function GoalLineChart({ exerciseName, targetWeight }: GoalLineChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !exerciseName) return;
    setLoading(true);
    getMaxWeightOverTime(user.id, exerciseName)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [user, exerciseName]);

  if (loading) {
    return <div className="h-48 bg-elevated rounded-lg animate-pulse" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-elevated rounded-lg">
        <p className="text-muted text-sm">No data yet</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={40} />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--surface-floating)", border: "1px solid var(--border-primary)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--accent-primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--accent-primary)" }}
          activeDot={{ r: 5 }}
          name="Max Weight (kg)"
        />
        {targetWeight && targetWeight > 0 && (
          <ReferenceLine
            y={targetWeight}
            stroke="var(--warning)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{ value: `Target: ${targetWeight}kg`, position: "insideTopRight", fill: "var(--warning)", fontSize: 11 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
