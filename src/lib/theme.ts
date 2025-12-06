export type Theme = "blue" | "red" | "slate";

export const themes = {
  blue: {
    name: "Blue",
    colors: {
      primary: "#2563eb", // blue-600
      primaryLight: "#3b82f6", // blue-500
      primaryDark: "#1d4ed8", // blue-700
      primaryAlt: "#1e40af", // blue-800
      bg: {
        gradient: "from-slate-900 to-slate-800",
        card: "bg-slate-900/50",
        cardHover: "hover:bg-slate-900",
        input: "bg-slate-800",
      },
      text: {
        primary: "text-white",
        secondary: "text-slate-400",
        muted: "text-slate-600",
      },
      border: {
        primary: "border-slate-700",
        light: "border-slate-600",
      },
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
      primary: "#dc2626", // red-600
      primaryLight: "#ef4444", // red-500
      primaryDark: "#b91c1c", // red-700
      primaryAlt: "#991b1b", // red-800
      bg: {
        gradient: "from-slate-950 via-red-950 to-slate-950",
        card: "bg-slate-900/70",
        cardHover: "hover:bg-slate-800/90",
        input: "bg-slate-900",
      },
      text: {
        primary: "text-white",
        secondary: "text-slate-200",
        muted: "text-slate-400",
      },
      border: {
        primary: "border-red-800/50",
        light: "border-red-700/40",
      },
      button: {
        primary: "bg-red-600 hover:bg-red-700 text-white",
        secondary:
          "bg-red-900/40 hover:bg-red-800/60 text-white border border-red-700/50",
        accent:
          "bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 hover:border-red-500",
      },
    },
  },
  slate: {
    name: "Slate",
    colors: {
      primary: "#64748b", // slate-500
      primaryLight: "#78909c", // slate-400
      primaryDark: "#475569", // slate-600
      primaryAlt: "#334155", // slate-700
      bg: {
        gradient: "from-slate-900 to-slate-800",
        card: "bg-slate-900/50",
        cardHover: "hover:bg-slate-900",
        input: "bg-slate-800",
      },
      text: {
        primary: "text-white",
        secondary: "text-slate-400",
        muted: "text-slate-600",
      },
      border: {
        primary: "border-slate-700",
        light: "border-slate-600",
      },
      button: {
        primary: "bg-slate-600 hover:bg-slate-700 text-white",
        secondary: "bg-slate-700 hover:bg-slate-600 text-white",
        accent:
          "bg-slate-600/20 border border-slate-500/50 hover:bg-slate-600/30 hover:border-slate-500",
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
