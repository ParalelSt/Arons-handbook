export type Theme = "midnight" | "crimson" | "forest" | "ember" | "slate";

export const themes: Record<Theme, { name: string; accent: string }> = {
  midnight: { name: "Midnight", accent: "#3B82F6" },
  crimson:  { name: "Crimson",  accent: "#DC2626" },
  forest:   { name: "Forest",   accent: "#16A34A" },
  ember:    { name: "Ember",    accent: "#D97706" },
  slate:    { name: "Slate",    accent: "#64748B" },
};

const VALID_THEMES = new Set<string>(Object.keys(themes));

/** Migrate old theme keys to new ones */
const MIGRATIONS: Record<string, Theme> = {
  "midnight-blue": "midnight",
  "deep-blue": "midnight",
  "blue": "midnight",
  "black-power-red": "crimson",
  "athletic-red": "crimson",
  "red": "crimson",
  "charcoal-red": "slate",
  "slate-minimal": "slate",
};

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "midnight";
  const stored = localStorage.getItem("app-theme");
  if (!stored) return "midnight";
  if (VALID_THEMES.has(stored)) return stored as Theme;
  return MIGRATIONS[stored] ?? "midnight";
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem("app-theme", theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
