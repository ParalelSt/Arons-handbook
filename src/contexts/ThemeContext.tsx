import React, { createContext, useContext, useState } from "react";
import type { Theme } from "@/lib/theme";
import { getStoredTheme, setStoredTheme } from "@/lib/theme";

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() =>
    getStoredTheme()
  );

  const handleSetTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    setStoredTheme(theme);
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
