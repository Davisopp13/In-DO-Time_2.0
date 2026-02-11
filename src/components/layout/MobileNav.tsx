"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Timer,
  FolderKanban,
  CheckSquare,
  StickyNote,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/timers", label: "Timers", icon: Timer },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-1/2 -translate-x-1/2 z-50 md:hidden" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <div className="glass flex items-center gap-0.5 px-2 py-1.5 rounded-full shadow-lg shadow-black/20">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-2 py-1 rounded-full transition-all duration-200 ${
                isActive
                  ? "text-[var(--accent)] bg-[var(--accent-muted)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
              title={item.label}
            >
              <item.icon size={20} />
              <span className={`text-[9px] font-medium leading-tight mt-0.5 ${
                isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
