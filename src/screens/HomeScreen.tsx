import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Header, Card, Button } from "@/components/ui/Layout";
import { workoutApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { WeekWorkouts } from "@/types";
import { format, parseISO } from "date-fns";
import { Plus, ChevronRight, LogOut } from "lucide-react";

export function HomeScreen() {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekWorkouts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeeks();
  }, []);

  async function loadWeeks() {
    try {
      setLoading(true);
      const data = await workoutApi.getByWeeks();
      setWeeks(data);
      setError(null);
    } catch (err) {
      setError("Failed to load workouts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getWeekNumber(weekStart: string): number {
    const date = parseISO(weekStart);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((days + 1) / 7);
  }

  function formatDateRange(weekStart: string, weekEnd: string): string {
    const start = parseISO(weekStart);
    const end = parseISO(weekEnd);
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }

  return (
    <Container>
      <Header
        title="Gym Logbook"
        action={
          <div className="flex gap-1 sm:gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/templates")}
              className="hidden sm:inline-flex"
            >
              Templates
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/exercises")}
              className="hidden sm:inline-flex"
            >
              Exercises
            </Button>
            <Button onClick={() => navigate("/workout/new")}>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 inline sm:mr-1" />
              <span className="hidden sm:inline">New</span>
            </Button>
            <Button variant="secondary" onClick={handleLogout} className="p-2">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile Navigation */}
        <div className="sm:hidden grid grid-cols-2 gap-2 mb-4">
          <Button variant="secondary" onClick={() => navigate("/templates")}>
            Templates
          </Button>
          <Button variant="secondary" onClick={() => navigate("/exercises")}>
            Exercises
          </Button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading your workouts...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && weeks.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl text-white mb-2">No Workouts Yet</h2>
            <p className="text-slate-400 mb-6">Start logging your training!</p>
            <Button onClick={() => navigate("/workout/new")}>
              <Plus className="w-5 h-5 inline mr-2" />
              Log Your First Workout
            </Button>
          </div>
        )}

        {!loading && weeks.length > 0 && (
          <div className="space-y-3">
            {weeks.map((week) => (
              <Card
                key={week.weekStart}
                onClick={() => navigate(`/week/${week.weekStart}`)}
                className="p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Week {getWeekNumber(week.weekStart)}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {formatDateRange(week.weekStart, week.weekEnd)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {week.workouts.length} workout
                      {week.workouts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
