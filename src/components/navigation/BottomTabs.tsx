"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Layers,
  Target,
  BarChart3,
  Menu,
  Dumbbell,
  Heart,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";

const tabs = [
  { href: "/", icon: Calendar, label: "Home", match: ["/", "/week", "/workout"] },
  { href: "/templates", icon: Layers, label: "Templates", match: ["/templates"] },
  { href: "/goals", icon: Target, label: "Goals", match: ["/goals"] },
  { href: "/analytics", icon: BarChart3, label: "Analytics", match: ["/analytics"] },
];

const moreItems = [
  { href: "/exercises", icon: Dumbbell, label: "Exercises" },
  { href: "/support", icon: Heart, label: "Support" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function isActive(pathname: string, match: string[]) {
  if (match.includes("/") && pathname === "/") return true;
  return match.some((m) => m !== "/" && pathname.startsWith(m));
}

export function BottomTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreItems.some((m) => pathname.startsWith(m.href));

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] right-3 bg-card border border-primary rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            {moreItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    active
                      ? "text-accent bg-accent-soft"
                      : "text-secondary hover:bg-elevated"
                  }`}
                  style={active ? { color: 'var(--accent-primary)' } : undefined}
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-nav border-t border-nav md:hidden"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.match);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
                style={active ? { color: 'var(--accent-primary)' } : undefined}
              >
                <tab.icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              isMoreActive || moreOpen ? "text-accent" : "text-muted"
            }`}
            style={isMoreActive || moreOpen ? { color: 'var(--accent-primary)' } : undefined}
          >
            {moreOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={isMoreActive ? 2.5 : 2} />}
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
