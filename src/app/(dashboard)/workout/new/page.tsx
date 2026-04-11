"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { workoutApi, workoutExerciseApi } from "@/lib/api";
import type { FormExercise } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { DayEditorPanel } from "@/components/workout/DayEditorPanel";
import { Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function NewWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(initialDate);
  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<FormExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function handleSave() {
    const valid = exercises.filter((ex) => ex.name.trim());
    if (valid.length === 0) {
      setToast({ msg: "Add at least one exercise", type: "error" });
      return;
    }

    if (!user) return;

    try {
      setSaving(true);

      // Create the workout shell
      const created = await workoutApi.create({
        date,
        title: title.trim() || undefined,
        exercises: [],
      });

      // Save exercises via saveAll
      await workoutExerciseApi.saveAll(
        created.id,
        valid.map((ex) => ({
          clientId: ex.clientId,
          name: ex.name,
          sets: ex.sets,
        })),
      );

      setToast({ msg: "Workout created!", type: "success" });
      setTimeout(() => router.push(`/workout/${created.id}`), 500);
    } catch {
      setToast({ msg: "Failed to create workout", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="New Workout"
        backHref="/"
        action={
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} /> Save
          </Button>
        }
      />

      <div className="px-4 md:px-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Push Day" />
        </div>

        <div className="border-t border-primary pt-4">
          <h2 className="text-sm font-semibold text-secondary mb-3">Exercises</h2>
          <DayEditorPanel exercises={exercises} onChange={setExercises} />
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
