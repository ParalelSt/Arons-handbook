export type Theme = "blue" | "red" | "slate";

export const themes = {
  blue: {
    name: "Blue",
    colors: {
      primary: "#2563eb",
      primaryLight: "#3b82f6",
      primaryDark: "#1d4ed8",
      primaryAlt: "#1e40af",
      bg: {
        gradient: "from-slate-900 to-slate-800",
        card: "bg-slate-800/50",
        cardHover: "hover:bg-slate-800",
        input: "bg-slate-800",
      },
      text: {
        primary: "text-white",
        secondary: "text-slate-400",
        muted: "text-slate-500",
      },
      border: {
        primary: "border-slate-700",
        light: "border-slate-600",
      },
      header: {
        bg: "bg-slate-900/80",
        border: "border-slate-700",
      },
      tabActive: "bg-blue-600 text-white",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "bg-slate-700 hover:bg-slate-600 text-white",
        accent:
          "bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 hover:border-blue-500",
      },
    },
  },
  red: {
    name: "Red",
    colors: {
      primary: "#dc2626",
      primaryLight: "#ef4444",
      primaryDark: "#b91c1c",
      primaryAlt: "#991b1b",
      bg: {
        gradient: "from-slate-950 via-red-950/30 to-slate-950",
        card: "bg-red-950/30",
        cardHover: "hover:bg-red-950/50",
        input: "bg-slate-900",
      },
      text: {
        primary: "text-white",
        secondary: "text-slate-300",
        muted: "text-slate-500",
      },
      border: {
        primary: "border-red-900/50",
        light: "border-red-800/30",
      },
      header: {
        bg: "bg-red-950/80",
        border: "border-red-900/60",
      },
      tabActive: "bg-red-600 text-white",
      button: {
        primary: "bg-red-600 hover:bg-red-700 text-white",
        secondary: "bg-red-900/60 hover:bg-red-900 text-white",
        accent:
          "bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 hover:border-red-500",
      },
    },
  },
  slate: {
    name: "Slate",
    colors: {
      primary: "#64748b",
      primaryLight: "#94a3b8",
      primaryDark: "#475569",
      primaryAlt: "#334155",
      bg: {
        gradient: "from-slate-950 to-slate-900",
        card: "bg-slate-800/60",
        cardHover: "hover:bg-slate-800",
        input: "bg-slate-800",
      },
      text: {
        primary: "text-white",
        secondary: "text-slate-400",
        muted: "text-slate-500",
      },
      border: {
        primary: "border-slate-700/80",
        light: "border-slate-600/60",
      },
      header: {
        bg: "bg-slate-900/90",
        border: "border-slate-700",
      },
      tabActive: "bg-slate-500 text-white",
      button: {
        primary: "bg-slate-500 hover:bg-slate-600 text-white",
        secondary: "bg-slate-700 hover:bg-slate-600 text-white",
        accent:
          "bg-slate-500/20 border border-slate-400/50 hover:bg-slate-500/30 hover:border-slate-400",
      },
    },
  },
};

export function getTheme(name: Theme) {
  return themes[name];
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem("app-theme");
  if (stored === "red" || stored === "slate" || stored === "blue") {
    return stored;
  }
  return "blue";
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem("app-theme", theme);
}
