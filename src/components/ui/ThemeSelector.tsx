import { useTheme } from "@/contexts/ThemeContext";
import { themes } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { Palette, X } from "lucide-react";
import { useState } from "react";

const THEME_SWATCHES: Record<Theme, string> = {
  "deep-blue": "#3B82F6",
  "athletic-red": "#DC2626",
  "slate-minimal": "#64748B",
};

export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const themeList = Object.keys(themes) as Theme[];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-elevated transition-colors text-muted hover:text-primary"
        title="Theme settings"
      >
        <Palette className="w-5 h-5" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-card border border-primary rounded-lg shadow-xl p-3 w-[180px] z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">Theme</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="text-muted hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {themeList.map((themeKey) => {
              const isActive = currentTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    setTheme(themeKey);
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive ? "bg-elevated text-primary" : "text-secondary hover:bg-elevated"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: THEME_SWATCHES[themeKey] }}
                    />
                    {themes[themeKey].name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
