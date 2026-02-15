/**
 * ExercisePickerModal
 *
 * Reusable modal for selecting exercises from the Exercise Library.
 * Features: search, sort, muscle-group grouping, create new.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Layout";
import { Modal } from "@/components/ui/Form";
import {
  getExerciseLibrary,
  createExerciseLibraryItem,
  sortExerciseLibrary,
  groupByMuscle,
  bumpExerciseUsage,
} from "@/lib/exerciseLibraryService";
import type { ExerciseLibraryItem, ExerciseLibrarySortMode } from "@/types";
import {
  Search,
  Plus,
  ChevronDown,
  Dumbbell,
  Layers,
  Loader2,
} from "lucide-react";

// ─── Sort option labels ───────────────────────────────────────────────────────

const SORT_OPTIONS: { value: ExerciseLibrarySortMode; label: string }[] = [
  { value: "recent", label: "Recently Used" },
  { value: "frequent", label: "Most Used" },
  { value: "alpha", label: "A → Z" },
  { value: "muscle", label: "Muscle Group" },
  { value: "created", label: "Date Created" },
];

// ─── LS key for persisted sort mode ───────────────────────────────────────────

const SORT_MODE_KEY = "exercisePickerSortMode";

function getPersistedSortMode(): ExerciseLibrarySortMode {
  try {
    const val = localStorage.getItem(SORT_MODE_KEY);
    if (val && SORT_OPTIONS.some((o) => o.value === val)) {
      return val as ExerciseLibrarySortMode;
    }
  } catch {
    // ignore
  }
  return "recent";
}

function persistSortMode(mode: ExerciseLibrarySortMode): void {
  try {
    localStorage.setItem(SORT_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

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
  /** Exercise names already in the current day (for dupe prevention) */
  existingNames?: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  existingNames = [],
}: ExercisePickerModalProps) {
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] =
    useState<ExerciseLibrarySortMode>(getPersistedSortMode);
  const [grouped, setGrouped] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("");
  const [newReps, setNewReps] = useState(10);
  const [newWeight, setNewWeight] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  // Existing names set for O(1) lookup (case-insensitive)
  const existingSet = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase())),
    [existingNames],
  );

  // ─── Load library when modal opens ──────────────────────────────────────────

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getExerciseLibrary();
      setLibrary(items);
    } catch (err) {
      console.error("[ExercisePickerModal] load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
      setSearch("");
      setShowCreate(false);
      setCreateError("");
      // Auto-focus search after render
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    }
  }, [isOpen, loadLibrary]);

  // ─── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let items = library;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.muscle_group ?? "").toLowerCase().includes(q),
      );
    }
    return sortExerciseLibrary(items, sortMode);
  }, [library, search, sortMode]);

  // ─── Handle sort change ─────────────────────────────────────────────────────

  function handleSortChange(mode: ExerciseLibrarySortMode) {
    setSortMode(mode);
    persistSortMode(mode);
    if (mode === "muscle") {
      setGrouped(true);
    }
  }

  // ─── Handle select ──────────────────────────────────────────────────────────

  async function handleSelect(item: ExerciseLibraryItem) {
    // Duplicate prevention
    if (existingSet.has(item.name.toLowerCase())) {
      return; // silently prevent — the item is shown as disabled
    }

    onSelect({
      name: item.name,
      muscle_group: item.muscle_group,
      default_reps: item.default_reps,
      default_weight: item.default_weight,
    });

    // Non-blocking usage bump
    bumpExerciseUsage(item.id).catch(() => {});

    onClose();
  }

  // ─── Handle create new ──────────────────────────────────────────────────────

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Check library dupe
    if (library.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setCreateError(
        "An exercise with this name already exists in your library.",
      );
      return;
    }

    try {
      setCreating(true);
      setCreateError("");
      const created = await createExerciseLibraryItem(
        trimmed,
        newMuscle.trim() || null,
        newReps,
        newWeight,
      );

      // Select it immediately
      onSelect({
        name: created.name,
        muscle_group: created.muscle_group,
        default_reps: created.default_reps,
        default_weight: created.default_weight,
      });

      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create exercise";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  // ─── Render exercise list ───────────────────────────────────────────────────

  function renderExerciseList() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-slate-400 ml-2 text-sm">Loading library…</span>
        </div>
      );
    }

    if (library.length === 0) {
      return (
        <div className="text-center py-10">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">
            Your exercise library is empty.
          </p>
          <p className="text-slate-500 text-xs">
            Create your first exercise below.
          </p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">
            No exercises match &ldquo;{search}&rdquo;
          </p>
        </div>
      );
    }

    // Grouped view
    if (grouped) {
      const groups = groupByMuscle(filtered);
      return (
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                {group}
              </p>
              <div className="space-y-1">
                {items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Flat list
    return (
      <div className="space-y-1">
        {filtered.map((item) => renderItem(item))}
      </div>
    );
  }

  function renderItem(item: ExerciseLibraryItem) {
    const isDupe = existingSet.has(item.name.toLowerCase());
    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item)}
        disabled={isDupe}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 ${
          isDupe
            ? "opacity-40 cursor-not-allowed bg-slate-900/30"
            : "hover:bg-slate-700/60 active:bg-slate-700"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{item.name}</p>
          {item.muscle_group && (
            <p className="text-slate-500 text-xs truncate">
              {item.muscle_group}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-slate-400 text-xs">
            {item.default_reps}r × {item.default_weight}kg
          </p>
          {isDupe && (
            <p className="text-yellow-500/80 text-xs">Already added</p>
          )}
        </div>
      </button>
    );
  }

  // ─── Create form ────────────────────────────────────────────────────────────

  function renderCreateForm() {
    return (
      <div className="border-t border-slate-700 pt-4 mt-2 space-y-3">
        <h3 className="text-white font-semibold text-sm">
          Create New Exercise
        </h3>

        {createError && (
          <p className="text-red-400 text-xs bg-red-900/20 rounded-lg px-3 py-2">
            {createError}
          </p>
        )}

        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Exercise name *"
          autoFocus
          className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          value={newMuscle}
          onChange={(e) => setNewMuscle(e.target.value)}
          placeholder="Muscle group (optional)"
          className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Default Reps
            </label>
            <input
              type="number"
              value={newReps || ""}
              onChange={(e) => setNewReps(parseInt(e.target.value) || 0)}
              min={1}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Default Weight (kg)
            </label>
            <input
              type="number"
              value={newWeight || ""}
              onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
              min={0}
              step={0.5}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreate(false);
              setCreateError("");
              setNewName("");
              setNewMuscle("");
              setNewReps(10);
              setNewWeight(0);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="flex-1"
          >
            {creating ? "Creating…" : "Create & Select"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Exercise">
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort + Group controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              value={sortMode}
              onChange={(e) =>
                handleSortChange(e.target.value as ExerciseLibrarySortMode)
              }
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          <button
            onClick={() => setGrouped((g) => !g)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              grouped
                ? "bg-blue-600/20 border-blue-500/50 text-blue-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Group by muscle"
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Group
          </button>
        </div>

        {/* Exercise list */}
        <div className="max-h-[40vh] overflow-y-auto -mx-1 px-1">
          {renderExerciseList()}
        </div>

        {/* Create new section */}
        {showCreate ? (
          renderCreateForm()
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Exercise
          </button>
        )}
      </div>
    </Modal>
  );
}
