"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Plus, Calendar, Layers } from "lucide-react";
import { getAllDayTemplatesWithWeekNames, createWorkoutFromDayTemplate, type DayTemplateInfo } from "@/lib/weekTemplateService";
import { Badge } from "@/components/ui/Badge";
import type { WorkoutWithExercises } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [dayTemplates, setDayTemplates] = useState<DayTemplateInfo[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function handleDayClick(date: Date, workout?: WorkoutWithExercises) {
    if (workout) {
      router.push(`/workout/${workout.id}`);
    } else {
      const dateStr = format(date, "yyyy-MM-dd");
      setSelectedDate(dateStr);
      setShowDayPicker(true);
      setLoadingTemplates(true);
      getAllDayTemplatesWithWeekNames()
        .then(setDayTemplates)
        .catch(() => setDayTemplates([]))
        .finally(() => setLoadingTemplates(false));
    }
  }

  async function handleApplyDayTemplate(dayTemplateId: string) {
    if (!selectedDate) return;
    try {
      setApplying(true);
      const workoutId = await createWorkoutFromDayTemplate(dayTemplateId, selectedDate);
      setShowDayPicker(false);
      setToast({ msg: "Workout created!", type: "success" });
      setTimeout(() => router.push(`/workout/${workoutId}`), 400);
    } catch {
      setToast({ msg: "Failed to create workout", type: "error" });
    } finally {
      setApplying(false);
    }
  }

  function handleWeekClick(weekStart: string) {
    router.push(`/week/${weekStart}`);
  }

  return (
    <div>
      <PageHeader
        title="Home"
        subtitle="Your workout calendar"
        action={
          <Button size="sm" onClick={() => router.push("/workout/new")}>
            <Plus size={16} /> Log Workout
          </Button>
        }
      />
      <CalendarGrid onDayClick={handleDayClick} onWeekClick={handleWeekClick} />

      {/* Day template picker modal */}
      <Modal
        open={showDayPicker}
        onClose={() => setShowDayPicker(false)}
        title={selectedDate ? `Add workout — ${format(new Date(selectedDate + "T12:00:00"), "MMM d, yyyy")}` : "Add workout"}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Choose a day template to create a workout, or go to templates to create one.
          </p>

          {loadingTemplates ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-elevated rounded-lg animate-pulse" />
              ))}
            </div>
          ) : dayTemplates.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dayTemplates.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => handleApplyDayTemplate(dt.id)}
                  disabled={applying}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-elevated hover:bg-card border border-primary transition-colors text-left disabled:opacity-50"
                >
                  <Calendar size={16} className="text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{dt.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="muted">{dt.weekTemplateName}</Badge>
                      <span className="text-xs text-muted">{dt.exercises.length} exercises</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Layers size={28} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No day templates yet</p>
            </div>
          )}

          <div className="flex gap-2 justify-end border-t border-primary pt-3">
            <Button variant="ghost" onClick={() => setShowDayPicker(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => { setShowDayPicker(false); router.push("/templates"); }}>
              <Layers size={14} /> Go to Templates
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
