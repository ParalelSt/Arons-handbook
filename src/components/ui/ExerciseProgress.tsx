import { useState, useEffect } from "react";
import { getExerciseComparison } from "@/lib/analytics";
import type { ExerciseComparison } from "@/types";

interface ExerciseProgressProps {
  exerciseName: string;
  currentWorkoutId: string;
  currentMaxWeight: number;
}

/**
 * Displays a "Previous: X reps @ Ykg (Week N – Day) ↑/↓" line
 * below an exercise card. Fetches data from the analytics service layer.
 */
export function ExerciseProgress({
  exerciseName,
  currentWorkoutId,
  currentMaxWeight,
}: ExerciseProgressProps) {
  const [comparison, setComparison] = useState<ExerciseComparison | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getExerciseComparison(
          exerciseName,
          currentWorkoutId,
          currentMaxWeight,
        );
        if (!cancelled) {
          setComparison(result);
        }
      } catch {
        // Silently fail — non-critical UI enhancement
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [exerciseName, currentWorkoutId, currentMaxWeight]);

  if (!comparison) return null;

  const trendIcon =
    comparison.trend === "up" ? "↑" : comparison.trend === "down" ? "↓" : "→";

  const trendColor =
    comparison.trend === "up"
      ? "text-success"
      : comparison.trend === "down"
        ? "text-danger"
        : "text-muted";

  return (
    <div className="mt-2 pt-2 border-t border-primary">
      <p className="text-xs text-muted">
        Previous:{" "}
        <span className="text-secondary">
          {comparison.previousReps} reps @ {comparison.previousWeight}kg
        </span>{" "}
        <span className="text-muted">({comparison.previousWeekDay})</span>{" "}
        <span className={trendColor}>{trendIcon}</span>
      </p>
    </div>
  );
}
