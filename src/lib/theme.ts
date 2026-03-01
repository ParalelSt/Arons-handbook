export type Theme = "deep-blue" | "athletic-red" | "slate-minimal";

export const themes: Record<Theme, { name: string; dataTheme: string }> = {
  "deep-blue": {
    name: "Deep Blue",
    dataTheme: "deep-blue",
  },
  "athletic-red": {
    name: "Athletic Red",
    dataTheme: "athletic-red",
  },
  "slate-minimal": {
    name: "Slate",
    dataTheme: "slate-minimal",
  },
};

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem("app-theme");
  if (
    stored === "deep-blue" ||
    stored === "athletic-red" ||
    stored === "slate-minimal"
  ) {
    return stored;
  }
  // Migrate old theme names
  if (stored === "red") return "athletic-red";
  if (stored === "slate") return "slate-minimal";
  return "deep-blue";
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem("app-theme", theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", themes[theme].dataTheme);
}
