"use client";

import { BottomTabs } from "./BottomTabs";
import { Sidebar } from "./Sidebar";

export function NavigationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="md:ml-60 min-h-screen pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tabs */}
      <BottomTabs />
    </div>
  );
}
