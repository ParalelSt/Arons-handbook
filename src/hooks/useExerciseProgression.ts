"use client";

import { useState, useEffect } from "react";
import { getExerciseProgression } from "@/lib/progression";
import type { ExerciseComparison } from "@/types";

export function useExerciseProgression(
  exerciseName: string,
  currentWorkoutDate: string,
  currentMaxWeight: number,
) {
  const [comparison, setComparison] = useState<ExerciseComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseName || !currentWorkoutDate) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getExerciseProgression(exerciseName, currentWorkoutDate, currentMaxWeight)
      .then(setComparison)
      .catch(() => setComparison(null))
      .finally(() => setLoading(false));
  }, [exerciseName, currentWorkoutDate, currentMaxWeight]);

  return { comparison, loading };
}
