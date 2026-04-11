"use client";

import { useEffect, useState } from "react";
import { exerciseApi, goalApi } from "@/lib/api";
import { getPersonalRecords } from "@/lib/analyticsService";
import { useAuth } from "@/hooks/useAuth";
import type { Exercise, ExerciseGoal, PRSummaryRow } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { GoalCard } from "@/components/goals/GoalCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Toast } from "@/components/ui/Toast";
import { Target, Plus, Search } from "lucide-react";

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ExerciseGoal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [prs, setPrs] = useState<PRSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [targetReps, setTargetReps] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [g, e, p] = await Promise.all([goalApi.getAll(), exerciseApi.getAll(), getPersonalRecords(user!.id)]);
      setGoals(g);
      setExercises(e);
      setPrs(p);
    } catch { } finally { setLoading(false); }
  }

  async function handleSaveGoal() {
    if (!selectedExercise) return;
    try {
      setSaving(true);
      await goalApi.upsert(selectedExercise, targetReps || undefined, targetWeight || undefined);
      setShowAdd(false);
      setSelectedExercise("");
      setTargetWeight(0);
      setTargetReps(0);
      loadData();
      setToast({ msg: "Goal saved!", type: "success" });
    } catch { setToast({ msg: "Failed to save goal", type: "error" }); }
    finally { setSaving(false); }
  }

  async function handleDeleteGoal(exerciseId: string) {
    try {
      await goalApi.delete(exerciseId);
      loadData();
      setToast({ msg: "Goal removed", type: "success" });
    } catch { setToast({ msg: "Failed to delete", type: "error" }); }
  }

  const filtered = search
    ? goals.filter((g) => g.exercise?.name?.toLowerCase().includes(search.toLowerCase()))
    : goals;

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle={`${goals.length} active goals`}
        action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Goal</Button>}
      />

      <div className="px-4 md:px-6 space-y-4">
        {goals.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search goals..." className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none" />
          </div>
        )}

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-card rounded-xl h-64 animate-pulse border border-primary" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon={Target} title="No goals yet" description="Set weight and rep targets for your exercises" action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Goal</Button>} />
        ) : (
          filtered.map((g) => {
            const pr = prs.find((p) => p.exercise_name.toLowerCase() === g.exercise?.name?.toLowerCase());
            return (
              <div key={g.id} className="relative">
                <GoalCard exerciseName={g.exercise?.name ?? "Unknown"} targetWeight={g.target_weight} targetReps={g.target_reps} currentBest={pr?.max_weight} />
                <button onClick={() => handleDeleteGoal(g.exercise_id)} className="absolute top-3 right-3 text-xs text-muted hover:text-danger transition-colors">Remove</button>
              </div>
            );
          })
        )}
      </div>

      {/* Add goal modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Goal" size="sm">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Exercise</label>
            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none">
              <option value="">Select exercise...</option>
              {exercises.filter((e) => !goals.some((g) => g.exercise_id === e.id)).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <Input label="Target Weight (kg)" type="number" value={targetWeight || ""} onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)} min={0} step={0.5} />
          <Input label="Target Reps" type="number" value={targetReps || ""} onChange={(e) => setTargetReps(parseInt(e.target.value) || 0)} min={0} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSaveGoal} loading={saving} disabled={!selectedExercise}>Save Goal</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
