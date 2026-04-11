"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Theme, getStoredTheme, setStoredTheme, applyTheme, themes } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: typeof themes;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "midnight",
  setTheme: () => {},
  themes,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("midnight");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    setStoredTheme(t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
