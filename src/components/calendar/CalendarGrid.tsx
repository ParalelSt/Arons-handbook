"use client";

import { useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarWeekRow } from "./CalendarWeekRow";
import { workoutApi } from "@/lib/api";
import type { WorkoutWithExercises } from "@/types";

interface CalendarGridProps {
  onDayClick: (date: Date, workout?: WorkoutWithExercises) => void;
  onWeekClick: (weekStart: string) => void;
}

export function CalendarGrid({ onDayClick, onWeekClick }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    workoutApi
      .getByWeeks(calStart, calEnd)
      .then((weeks) => {
        setWorkouts(weeks.flatMap((w) => w.workouts));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks = eachWeekOfInterval({ start: calStart, end: calEnd }, { weekStartsOn: 1 });

  // Build a map of date -> workout
  const workoutMap = new Map<string, WorkoutWithExercises>();
  for (const w of workouts) {
    workoutMap.set(w.date, w);
  }

  return (
    <div className="px-4 md:px-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold text-primary">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-muted uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className={`space-y-1 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {weeks.map((weekStart) => (
          <CalendarWeekRow
            key={weekStart.toISOString()}
            weekStart={weekStart}
            currentMonth={currentMonth}
            workoutMap={workoutMap}
            onDayClick={onDayClick}
            onWeekClick={onWeekClick}
            isSameMonth={isSameMonth}
          />
        ))}
      </div>
    </div>
  );
}
