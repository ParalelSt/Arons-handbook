export type Theme = "midnight-blue" | "black-power-red" | "charcoal-red";

export const themes: Record<Theme, { name: string; dataTheme: string }> = {
  "midnight-blue": {
    name: "Midnight Blue",
    dataTheme: "midnight-blue",
  },
  "black-power-red": {
    name: "Black Power Red",
    dataTheme: "black-power-red",
  },
  "charcoal-red": {
    name: "Charcoal Red",
    dataTheme: "charcoal-red",
  },
};

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem("app-theme");
  if (
    stored === "midnight-blue" ||
    stored === "black-power-red" ||
    stored === "charcoal-red"
  ) {
    return stored;
  }
  // Migrate old theme names
  if (stored === "deep-blue" || stored === "blue") return "midnight-blue";
  if (stored === "athletic-red" || stored === "red") return "black-power-red";
  if (stored === "slate-minimal" || stored === "slate") return "charcoal-red";
  return "midnight-blue";
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem("app-theme", theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", themes[theme].dataTheme);
}
