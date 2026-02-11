"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./AppShell";
import { useWorkspace } from "@/lib/workspace";
import {
  LayoutDashboard,
  Timer,
  FolderKanban,
  CheckSquare,
  StickyNote,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  Settings,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timers", label: "Timers", icon: Timer },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { currentWorkspace } = useWorkspace();
  const pathname = usePathname();

  const workspaceColor = currentWorkspace?.color ?? "#84cc16";

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? "w-16" : "w-80"
        }`}
    >
      <div
        className="flex flex-col h-full m-3 mr-0 rounded-2xl glass overflow-hidden transition-all duration-500"
        style={{ borderColor: `${workspaceColor}30` }}
      >
        {/* Logo */}
        <div className={`flex flex-col items-center justify-center transition-all duration-300 ${collapsed ? "px-2 py-4" : "px-4 pt-10 pb-6"}`}>
          <div className={`relative transition-all duration-300 ${collapsed ? "w-10 h-10" : "w-48 h-24"}`}>
            <Image
              src="/In_DO_Time_Logo.png"
              alt="In DO Time Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {!collapsed && (
            <div className="mt-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Dedicated Operations
              </p>
            </div>
          )}
        </div>

        {/* Workspace Indicator (Desktop Expanded) */}
        {!collapsed && currentWorkspace && (
          <div className="px-6 mb-6">
            <div
              className="px-4 py-3 rounded-xl glass border-l-4 transition-all duration-500"
              style={{ borderLeftColor: workspaceColor, backgroundColor: `${workspaceColor}05` }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Current Workspace</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{currentWorkspace.name}</p>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1 px-3 pt-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  } ${collapsed ? "justify-center" : ""}`}
                style={isActive ? {
                  backgroundColor: `${workspaceColor}15`,
                  color: workspaceColor,
                  border: `1px solid ${workspaceColor}30`
                } : {}}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  size={20}
                  className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? "" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Settings + Collapse */}
        <div className="px-3 pb-6 flex flex-col gap-1">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all duration-200 ${pathname === "/settings"
              ? "text-[var(--text-primary)]"
              : ""
              } ${collapsed ? "justify-center" : ""}`}
            style={pathname === "/settings" ? {
              backgroundColor: `${workspaceColor}15`,
              color: workspaceColor,
              border: `1px solid ${workspaceColor}30`
            } : {}}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings size={20} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <ThemeToggle collapsed={collapsed} />

          <button
            onClick={toggleCollapsed}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all duration-200 ${collapsed ? "justify-center" : ""
              }`}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <PanelLeft size={20} className="flex-shrink-0" />
            ) : (
              <>
                <PanelLeftClose size={20} className="flex-shrink-0" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
