import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { workoutApi } from "@/lib/api";
import type { WorkoutWithExercises } from "@/types";
import {
  format,
  parseISO,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  getISOWeek,
} from "date-fns";
import { ChevronRight, Plus, Edit2 } from "lucide-react";
import { AdBanner } from "@/components/ui/AdBanner";
import { SkeletonList } from "@/components/ui/SkeletonCard";

export function WeekDetailScreen() {
  const navigate = useNavigate();
  const { weekStart } = useParams<{ weekStart: string }>();
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (weekStart) {
      loadWeekWorkouts();
    }

    async function loadWeekWorkouts() {
      try {
        setLoading(true);
        const weekStartDate = parseISO(weekStart!);
        const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

        const weeks = await workoutApi.getByWeeks(weekStartDate, weekEndDate);
        const currentWeek = weeks.find((w) => w.weekStart === weekStart);

        setWorkouts(currentWeek?.workouts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }, [weekStart]);

  function getWeekDays() {
    if (!weekStart) return [];
    const start = startOfWeek(parseISO(weekStart), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }

  function getWorkoutForDate(date: Date): WorkoutWithExercises | undefined {
    const dateStr = format(date, "yyyy-MM-dd");
    return workouts.find((w) => w.date === dateStr);
  }

  function getDayTitle(date: Date): string {
    const workout = getWorkoutForDate(date);
    if (!workout) return "Rest";
    if (workout.title) return workout.title;

    // Generate title from exercises
    const exerciseCount = workout.workout_exercises.length;
    if (exerciseCount === 0) return "Workout";
    if (exerciseCount === 1)
      return workout.workout_exercises[0].exercise?.name || "Workout";
    return `${exerciseCount} exercises`;
  }

  const weekDays = getWeekDays();
  const weekNumber = weekStart ? getISOWeek(parseISO(weekStart)) : 0;

  return (
    <Container>
      <Header
        title={`Week ${weekNumber}`}
        onBack={() => navigate("/")}
        action={
          <Button
            onClick={() =>
              navigate(
                `/workout/new?date=${format(
                  new Date(weekStart || new Date()),
                  "yyyy-MM-dd",
                )}&weekStart=${weekStart}`,
              )
            }
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        }
      />
      <Breadcrumbs
        items={[
          { label: "Home", onClick: () => navigate("/") },
          { label: "Week", onClick: () => navigate(`/week/${weekStart}`) },
        ]}
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading && <SkeletonList count={7} lines={2} />}

        {!loading && (
          <div className="space-y-2 sm:space-y-3">
            {weekDays.map((day) => {
              const workout = getWorkoutForDate(day);
              const dayName = format(day, "EEEE");
              const dayDate = format(day, "MMM d");
              const isRest = !workout;

              return (
                <Card
                  key={day.toISOString()}
                  className={cn("p-5", isRest && "opacity-60")}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex-1 min-w-0",
                        workout && "cursor-pointer",
                      )}
                      onClick={() =>
                        workout && navigate(`/workout/${workout.id}`)
                      }
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-primary">
                          {dayName}
                        </h3>
                        <span className="text-sm text-muted">
                          {dayDate}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm",
                          isRest ? "text-muted italic" : "text-secondary",
                        )}
                      >
                        {getDayTitle(day)}
                      </p>
                      {workout && (
                        <p className="text-xs text-muted mt-1">
                          {workout.workout_exercises.length} exercise
                          {workout.workout_exercises.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {workout ? (
                        <>
                          {/* Edit day button */}
                          <button
                            onClick={() =>
                              navigate(`/workout/${workout.id}/edit`)
                            }
                            aria-label={`Edit ${dayName}`}
                            className="p-2 text-secondary hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {/* View button */}
                          <button
                            onClick={() =>
                              navigate(`/workout/${workout.id}`)
                            }
                            aria-label={`View ${dayName}`}
                            className="p-2 text-muted hover:text-secondary rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          className="px-3 py-1.5 bg-elevated hover:bg-elevated text-primary text-sm rounded-lg transition-colors"
                          onClick={() =>
                            navigate(
                              `/workout/new?date=${format(
                                day,
                                "yyyy-MM-dd",
                              )}&weekStart=${weekStart}`,
                            )
                          }
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Ad placement — safe, between sections, not inside forms */}
            <AdBanner className="mt-4" />
          </div>
        )}
      </div>
    </Container>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
