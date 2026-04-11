"use client";

import { GoalLineChart } from "./GoalLineChart";
import { Card } from "@/components/ui/Card";
import { Target } from "lucide-react";

interface GoalCardProps {
  exerciseName: string;
  targetWeight?: number;
  targetReps?: number;
  currentBest?: number;
}

export function GoalCard({ exerciseName, targetWeight, targetReps, currentBest }: GoalCardProps) {
  const progress = targetWeight && currentBest ? Math.min(100, (currentBest / targetWeight) * 100) : 0;

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent-soft)" }}>
            <Target size={16} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary">{exerciseName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {targetWeight && <span className="text-xs text-muted">Target: {targetWeight}kg</span>}
              {targetReps && <span className="text-xs text-muted">x {targetReps} reps</span>}
            </div>
          </div>
        </div>
        {progress > 0 && (
          <span className="text-xs font-bold" style={{ color: progress >= 100 ? "var(--success)" : "var(--accent-primary)" }}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {targetWeight && (
        <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: progress >= 100 ? "var(--success)" : "var(--accent-primary)" }}
          />
        </div>
      )}

      {/* Chart */}
      <GoalLineChart exerciseName={exerciseName} targetWeight={targetWeight} />
    </Card>
  );
}
