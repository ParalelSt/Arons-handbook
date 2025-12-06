import { useTheme } from "@/contexts/ThemeContext";
import { themes } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { Palette, X } from "lucide-react";
import { useState } from "react";

export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const themeList: Theme[] = ["blue", "red", "slate"];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
        title="Theme settings"
      >
        <Palette className="w-5 h-5" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3 min-w-[180px] z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Theme</h3>
            <button
              onClick={() => setShowMenu(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {themeList.map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  setTheme(theme);
                  setShowMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  currentTheme === theme
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      theme === "blue"
                        ? "bg-blue-500"
                        : theme === "red"
                        ? "bg-red-500"
                        : "bg-slate-500"
                    }`}
                  ></div>
                  {themes[theme].name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  );
}
