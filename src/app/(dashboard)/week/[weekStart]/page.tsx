"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, addDays } from "date-fns";
import { workoutApi } from "@/lib/api";
import type { WorkoutWithExercises } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Plus, Dumbbell } from "lucide-react";

export default function WeekDetailPage() {
  const params = useParams<{ weekStart: string }>();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = params.weekStart;
  const weekStartDate = parseISO(weekStart);

  useEffect(() => {
    setLoading(true);
    const start = weekStartDate;
    const end = addDays(start, 6);
    workoutApi
      .getByWeeks(start, end)
      .then((weeks) => setWorkouts(weeks.flatMap((w) => w.workouts)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [weekStart]);

  // Build 7-day grid
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const workout = workouts.find((w) => w.date === dateStr);
    return { date, dateStr, dayName: format(date, "EEEE"), shortDate: format(date, "MMM d"), workout };
  });

  const weekLabel = `${format(weekStartDate, "MMM d")} — ${format(addDays(weekStartDate, 6), "MMM d, yyyy")}`;

  return (
    <div>
      <PageHeader title="Week Overview" subtitle={weekLabel} backHref="/" />

      <div className="px-4 md:px-6 space-y-2">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          days.map(({ date, dateStr, dayName, shortDate, workout }) => (
            <Card
              key={dateStr}
              hoverable
              onClick={() => {
                if (workout) router.push(`/workout/${workout.id}`);
                else router.push(`/workout/new?date=${dateStr}`);
              }}
              className="flex items-center gap-4"
            >
              <div className="w-12 text-center shrink-0">
                <p className="text-xs text-muted font-medium">{dayName.slice(0, 3)}</p>
                <p className="text-lg font-bold text-primary">{format(date, "d")}</p>
              </div>

              <div className="flex-1 min-w-0">
                {workout ? (
                  <>
                    <p className="text-sm font-medium text-primary truncate">
                      {workout.title || "Workout"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="accent">
                        {workout.workout_exercises.length} exercise{workout.workout_exercises.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">Rest day</p>
                )}
              </div>

              {!workout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/workout/new?date=${dateStr}`);
                  }}
                >
                  <Plus size={14} />
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
