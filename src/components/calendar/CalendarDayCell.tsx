"use client";

import { format } from "date-fns";
import type { WorkoutWithExercises } from "@/types";
import { cn } from "@/lib/utils";

interface CalendarDayCellProps {
  day: Date;
  workout?: WorkoutWithExercises;
  inMonth: boolean;
  isToday: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function CalendarDayCell({ day, workout, inMonth, isToday, onClick }: CalendarDayCellProps) {
  const exerciseCount = workout?.workout_exercises?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center py-2 md:py-3 rounded-lg transition-all",
        "hover:bg-elevated active:scale-95",
        !inMonth && "opacity-30",
        workout && "bg-card",
      )}
    >
      {/* Day number — today gets a small accent circle behind it */}
      <span
        className={cn(
          "w-7 h-7 flex items-center justify-center rounded-full text-sm leading-none",
          isToday && "text-white font-bold",
          !isToday && workout && "font-semibold text-primary",
          !isToday && !workout && "font-medium text-secondary",
        )}
        style={isToday ? { backgroundColor: "var(--accent-primary)" } : undefined}
      >
        {format(day, "d")}
      </span>

      {/* Workout indicator */}
      {workout && (
        <div className="flex items-center gap-0.5 mt-1">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent-primary)" }}
          />
          {exerciseCount > 0 && (
            <span className="text-[9px] font-medium" style={{ color: "var(--accent-primary)" }}>{exerciseCount}</span>
          )}
        </div>
      )}
    </button>
  );
}
