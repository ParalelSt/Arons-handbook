"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Layers,
  Target,
  BarChart3,
  Dumbbell,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const mainNav = [
  { href: "/", icon: Calendar, label: "Home", match: ["/", "/week", "/workout"] },
  { href: "/templates", icon: Layers, label: "Templates", match: ["/templates"] },
  { href: "/goals", icon: Target, label: "Goals", match: ["/goals"] },
  { href: "/analytics", icon: BarChart3, label: "Analytics", match: ["/analytics"] },
];

const secondaryNav = [
  { href: "/exercises", icon: Dumbbell, label: "Exercises" },
  { href: "/support", icon: Heart, label: "Support" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function isActive(pathname: string, match: string[]) {
  if (match.includes("/") && pathname === "/") return true;
  return match.some((m) => m !== "/" && pathname.startsWith(m));
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 bg-nav border-r border-nav">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-nav">
        <h1 className="text-lg font-bold text-primary tracking-tight">
          <span className="text-accent" style={{ color: 'var(--accent-primary)' }}>Gym</span> Logbook
        </h1>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNav.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-secondary hover:bg-elevated hover:text-primary"
              }`}
              style={active ? { color: 'var(--accent-primary)', backgroundColor: 'var(--accent-soft)' } : undefined}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-primary">
          <p className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted font-semibold">
            More
          </p>
          {secondaryNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-secondary hover:bg-elevated hover:text-primary"
                }`}
                style={active ? { color: 'var(--accent-primary)', backgroundColor: 'var(--accent-soft)' } : undefined}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-nav">
        <p className="px-3 mb-2 text-xs text-muted truncate">
          {user?.email}
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-secondary hover:bg-elevated hover:text-danger transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
