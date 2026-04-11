"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllWeekTemplates, createWeekTemplate, deleteWeekTemplate, getAllDayTemplatesWithWeekNames, createWorkoutFromDayTemplate, type DayTemplateInfo } from "@/lib/weekTemplateService";
import type { WeekTemplate } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Plus, Pencil, Trash2, Layers, Calendar, Play } from "lucide-react";
import { format } from "date-fns";

type Tab = "weekly" | "daily";

export default function TemplatesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("weekly");
  const [weekTemplates, setWeekTemplates] = useState<WeekTemplate[]>([]);
  const [dayTemplates, setDayTemplates] = useState<DayTemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Use day template
  const [useDayId, setUseDayId] = useState<string | null>(null);
  const [useDate, setUseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [usingDay, setUsingDay] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [wt, dt] = await Promise.all([getAllWeekTemplates(), getAllDayTemplatesWithWeekNames()]);
      setWeekTemplates(wt);
      setDayTemplates(dt);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      setCreating(true);
      const created = await createWeekTemplate(newName.trim());
      setShowCreate(false);
      setNewName("");
      router.push(`/templates/${created.id}/edit`);
    } catch { setToast({ msg: "Failed to create template", type: "error" }); }
    finally { setCreating(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteWeekTemplate(deleteId);
      setDeleteId(null);
      loadData();
      setToast({ msg: "Template deleted", type: "success" });
    } catch { setToast({ msg: "Failed to delete", type: "error" }); }
    finally { setDeleting(false); }
  }

  async function handleUseDay() {
    if (!useDayId) return;
    try {
      setUsingDay(true);
      const workoutId = await createWorkoutFromDayTemplate(useDayId, useDate);
      setUseDayId(null);
      setToast({ msg: "Workout created!", type: "success" });
      setTimeout(() => router.push(`/workout/${workoutId}`), 500);
    } catch { setToast({ msg: "Failed to create workout", type: "error" }); }
    finally { setUsingDay(false); }
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Template
          </Button>
        }
      />

      {/* Tab bar */}
      <div className="px-4 md:px-6 mb-4">
        <div className="flex gap-1 bg-elevated rounded-lg p-1">
          {([["weekly", "Weekly", Layers], ["daily", "Daily", Calendar]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? "text-white" : "text-secondary hover:text-primary"}`} style={tab === id ? { backgroundColor: "var(--accent-primary)" } : undefined}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-card rounded-xl h-20 animate-pulse border border-primary" />)
        ) : tab === "weekly" ? (
          weekTemplates.length === 0 ? (
            <EmptyState icon={Layers} title="No templates yet" description="Create a weekly template to plan your workouts" action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Create Template</Button>} />
          ) : (
            weekTemplates.map((t) => (
              <Card key={t.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{t.name}</p>
                  <p className="text-xs text-muted mt-0.5">Created {format(new Date(t.created_at), "MMM d, yyyy")}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/templates/${t.id}/edit`)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(t.id)}><Trash2 size={14} className="text-danger" /></Button>
                </div>
              </Card>
            ))
          )
        ) : (
          dayTemplates.length === 0 ? (
            <EmptyState icon={Calendar} title="No day templates" description="Day templates come from your weekly templates" />
          ) : (
            dayTemplates.map((d) => (
              <Card key={d.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate">{d.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="muted">{d.weekTemplateName}</Badge>
                    <span className="text-xs text-muted">{d.exercises.length} exercises</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setUseDayId(d.id); setUseDate(format(new Date(), "yyyy-MM-dd")); }}>
                  <Play size={14} /> Use
                </Button>
              </Card>
            ))
          )
        )}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Weekly Template" size="sm">
        <div className="space-y-4">
          <Input label="Template Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Push/Pull/Legs" autoFocus />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Use day template modal */}
      <Modal open={!!useDayId} onClose={() => setUseDayId(null)} title="Use Day Template" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-secondary">This will create a workout on the selected date. If a workout already exists on that day, it will be replaced.</p>
          <Input label="Date" type="date" value={useDate} onChange={(e) => setUseDate(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setUseDayId(null)}>Cancel</Button>
            <Button onClick={handleUseDay} loading={usingDay}>Create Workout</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Template" message="This will permanently delete this template and all its days." confirmLabel="Delete" loading={deleting} />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
