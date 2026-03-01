import React, { createContext, useContext, useState, useEffect } from "react";
import type { Theme } from "@/lib/theme";
import { getStoredTheme, setStoredTheme, applyTheme } from "@/lib/theme";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() =>
    getStoredTheme(),
  );

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleSetTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    setStoredTheme(theme);
    applyTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
