"use client";

import { useExerciseProgression } from "@/hooks/useExerciseProgression";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ExerciseProgressProps {
  exerciseName: string;
  currentWorkoutDate: string;
  currentMaxWeight: number;
}

export function ExerciseProgress({ exerciseName, currentWorkoutDate, currentMaxWeight }: ExerciseProgressProps) {
  const { comparison, loading } = useExerciseProgression(exerciseName, currentWorkoutDate, currentMaxWeight);

  if (loading || !comparison) return null;

  const trendIcon = {
    up: <TrendingUp size={14} className="text-success" />,
    down: <TrendingDown size={14} className="text-danger" />,
    same: <Minus size={14} className="text-muted" />,
  };

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      {trendIcon[comparison.trend]}
      <span>
        Previous: {comparison.previousReps}r x {comparison.previousWeight}kg
        <span className="ml-1 opacity-70">({comparison.previousWeekDay})</span>
      </span>
    </div>
  );
}
