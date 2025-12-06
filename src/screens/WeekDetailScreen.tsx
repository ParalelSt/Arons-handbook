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
import { ChevronRight, Plus } from "lucide-react";

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
          <Button onClick={() => navigate("/workout/new")}>
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
        {loading && (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading week...</div>
          </div>
        )}

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
                  onClick={() => workout && navigate(`/workout/${workout.id}`)}
                  className={cn("p-5", isRest && "opacity-60 cursor-default")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {dayName}
                        </h3>
                        <span className="text-sm text-slate-500">
                          {dayDate}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm",
                          isRest ? "text-slate-600 italic" : "text-slate-400"
                        )}
                      >
                        {getDayTitle(day)}
                      </p>
                      {workout && (
                        <p className="text-xs text-slate-600 mt-1">
                          {workout.workout_exercises.length} exercise
                          {workout.workout_exercises.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    {workout ? (
                      <ChevronRight className="w-6 h-6 text-slate-500" />
                    ) : (
                      <button
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/workout/new?date=${format(day, "yyyy-MM-dd")}`
                          );
                        }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
