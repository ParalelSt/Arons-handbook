"use client";

import { eachDayOfInterval, endOfWeek, format, isToday } from "date-fns";
import { CalendarDayCell } from "./CalendarDayCell";
import type { WorkoutWithExercises } from "@/types";

interface CalendarWeekRowProps {
  weekStart: Date;
  currentMonth: Date;
  workoutMap: Map<string, WorkoutWithExercises>;
  onDayClick: (date: Date, workout?: WorkoutWithExercises) => void;
  onWeekClick: (weekStart: string) => void;
  isSameMonth: (date: Date, month: Date) => boolean;
}

export function CalendarWeekRow({
  weekStart,
  currentMonth,
  workoutMap,
  onDayClick,
  onWeekClick,
  isSameMonth,
}: CalendarWeekRowProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekKey = format(weekStart, "yyyy-MM-dd");
  const workoutsThisWeek = days.filter((d) => workoutMap.has(format(d, "yyyy-MM-dd"))).length;

  return (
    <div
      className="grid grid-cols-7 rounded-lg hover:bg-card/50 transition-colors cursor-pointer group"
      onClick={() => onWeekClick(weekKey)}
    >
      {days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const workout = workoutMap.get(dateStr);
        const inMonth = isSameMonth(day, currentMonth);

        return (
          <CalendarDayCell
            key={dateStr}
            day={day}
            workout={workout}
            inMonth={inMonth}
            isToday={isToday(day)}
            onClick={(e) => {
              e.stopPropagation();
              onDayClick(day, workout);
            }}
          />
        );
      })}
    </div>
  );
}
