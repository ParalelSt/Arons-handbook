"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/lib/theme";
import { themes } from "@/lib/theme";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogOut, Palette, User, Check } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const themeKeys = Object.keys(themes) as Theme[];

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="px-4 md:px-6 space-y-5">
        {/* Account */}
        <Card>
          <div className="flex items-center gap-3 mb-1">
            <User size={16} className="text-muted" />
            <h3 className="text-sm font-semibold text-primary">Account</h3>
          </div>
          <p className="text-sm text-secondary ml-7">{user?.email}</p>
        </Card>

        {/* Theme */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Palette size={16} className="text-muted" />
            <h3 className="text-sm font-semibold text-primary">Theme</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {themeKeys.map((key) => {
              const t = themes[key];
              const active = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`relative flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${
                    active ? "border-2" : "border-primary hover:border-secondary"
                  }`}
                  style={active ? { borderColor: t.accent } : undefined}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: t.accent }}
                  >
                    {active && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-xs text-secondary font-medium">{t.name}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Sign out */}
        <Button variant="danger" className="w-full" onClick={signOut}>
          <LogOut size={16} /> Sign Out
        </Button>
      </div>
    </div>
  );
}
