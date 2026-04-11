"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  getExerciseLibrary,
  createExerciseLibraryItem,
  sortExerciseLibrary,
  groupByMuscle,
  bumpExerciseUsage,
} from "@/lib/exerciseLibraryService";
import type { ExerciseLibraryItem, ExerciseLibrarySortMode } from "@/types";
import { Search, Plus, ChevronDown, Dumbbell, Layers, Loader2 } from "lucide-react";

const SORT_OPTIONS: { value: ExerciseLibrarySortMode; label: string }[] = [
  { value: "recent", label: "Recently Used" },
  { value: "frequent", label: "Most Used" },
  { value: "alpha", label: "A → Z" },
  { value: "muscle", label: "Muscle Group" },
  { value: "created", label: "Date Created" },
];

function getPersistedSortMode(): ExerciseLibrarySortMode {
  try {
    const val = localStorage.getItem("exercisePickerSortMode");
    if (val && SORT_OPTIONS.some((o) => o.value === val)) return val as ExerciseLibrarySortMode;
  } catch {}
  return "recent";
}

interface ExercisePickerResult {
  name: string;
  muscle_group: string | null;
  default_reps: number;
  default_weight: number;
}

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExercisePickerResult) => void;
  existingNames?: string[];
}

export function ExercisePickerModal({ isOpen, onClose, onSelect, existingNames = [] }: ExercisePickerModalProps) {
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<ExerciseLibrarySortMode>(getPersistedSortMode);
  const [grouped, setGrouped] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [newReps, setNewReps] = useState(10);
  const [newWeight, setNewWeight] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const existingSet = useMemo(() => new Set(existingNames.map((n) => n.toLowerCase())), [existingNames]);

  const loadLibrary = useCallback(async () => {
    try { setLoading(true); setLibrary(await getExerciseLibrary()); }
    catch (err) { console.error("[ExercisePickerModal] load error:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isOpen) { loadLibrary(); setSearch(""); setShowCreate(false); setCreateError(""); requestAnimationFrame(() => searchRef.current?.focus()); }
  }, [isOpen, loadLibrary]);

  const filtered = useMemo(() => {
    let items = library;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.muscle_group ?? "").toLowerCase().includes(q));
    }
    return sortExerciseLibrary(items, sortMode);
  }, [library, search, sortMode]);

  function handleSortChange(mode: ExerciseLibrarySortMode) {
    setSortMode(mode);
    try { localStorage.setItem("exercisePickerSortMode", mode); } catch {}
    if (mode === "muscle") setGrouped(true);
  }

  async function handleSelect(item: ExerciseLibraryItem) {
    if (existingSet.has(item.name.toLowerCase())) return;
    onSelect({ name: item.name, muscle_group: item.muscle_group, default_reps: item.default_reps, default_weight: item.default_weight });
    bumpExerciseUsage(item.id).catch(() => {});
    onClose();
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (library.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) { setCreateError("Already exists."); return; }
    try {
      setCreating(true); setCreateError("");
      const created = await createExerciseLibraryItem(trimmed, newMuscle.trim() || null, newReps, newWeight);
      onSelect({ name: created.name, muscle_group: created.muscle_group, default_reps: created.default_reps, default_weight: created.default_weight });
      onClose();
    } catch (err: unknown) { setCreateError(err instanceof Error ? err.message : "Failed"); }
    finally { setCreating(false); }
  }

  function renderItem(item: ExerciseLibraryItem) {
    const isDupe = existingSet.has(item.name.toLowerCase());
    return (
      <button key={item.id} onClick={() => handleSelect(item)} disabled={isDupe} className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 ${isDupe ? "opacity-40 cursor-not-allowed bg-elevated" : "hover:bg-elevated"}`}>
        <div className="min-w-0 flex-1">
          <p className="text-primary text-sm font-medium truncate">{item.name}</p>
          {item.muscle_group && <p className="text-muted text-xs truncate">{item.muscle_group}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-secondary text-xs">{item.default_reps}r x {item.default_weight}kg</p>
          {isDupe && <p className="text-warning text-xs">Already added</p>}
        </div>
      </button>
    );
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Select Exercise" size="md">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none focus:ring-2" />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select value={sortMode} onChange={(e) => handleSortChange(e.target.value as ExerciseLibrarySortMode)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-card border border-primary text-primary text-xs focus:outline-none">
              {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
          <button onClick={() => setGrouped((g) => !g)} className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${grouped ? "bg-accent-soft border-accent text-accent" : "bg-card border-primary text-secondary hover:text-primary"}`}>
            <Layers className="w-3.5 h-3.5 inline mr-1" />Group
          </button>
        </div>

        <div className="max-h-[40vh] overflow-y-auto -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-secondary animate-spin" /><span className="text-secondary ml-2 text-sm">Loading...</span></div>
          ) : library.length === 0 ? (
            <div className="text-center py-10"><Dumbbell className="w-10 h-10 text-muted mx-auto mb-3" /><p className="text-muted text-sm">Library is empty</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8"><p className="text-muted text-sm">No matches for &ldquo;{search}&rdquo;</p></div>
          ) : grouped ? (
            <div className="space-y-4">{Array.from(groupByMuscle(filtered).entries()).map(([group, items]) => (
              <div key={group}><p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 px-1">{group}</p><div className="space-y-1">{items.map(renderItem)}</div></div>
            ))}</div>
          ) : (
            <div className="space-y-1">{filtered.map(renderItem)}</div>
          )}
        </div>

        {showCreate ? (
          <div className="border-t border-primary pt-4 mt-2 space-y-3">
            <h3 className="text-primary font-semibold text-sm">Create New Exercise</h3>
            {createError && <p className="text-danger text-xs bg-danger-surface rounded-lg px-3 py-2">{createError}</p>}
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Exercise name *" autoFocus className="w-full px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none" />
            <input value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)} placeholder="Muscle group (optional)" className="w-full px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted mb-1 block">Default Reps</label><input type="number" value={newReps || ""} onChange={(e) => setNewReps(parseInt(e.target.value) || 0)} min={1} className="w-full px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none" /></div>
              <div><label className="text-xs text-muted mb-1 block">Default Weight (kg)</label><input type="number" value={newWeight || ""} onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)} min={0} step={0.5} className="w-full px-3 py-2 rounded-lg bg-elevated border border-primary text-primary text-sm focus:outline-none" /></div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setCreateError(""); setNewName(""); setNewMuscle(""); setNewReps(10); setNewWeight(0); }} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()} loading={creating} className="flex-1">{creating ? "Creating..." : "Create & Select"}</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCreate(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-secondary text-secondary hover:text-primary hover:border-primary transition-colors text-sm">
            <Plus className="w-4 h-4" />Create New Exercise
          </button>
        )}
      </div>
    </Modal>
  );
}
