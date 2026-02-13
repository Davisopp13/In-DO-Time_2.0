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
import { Z_INDEX } from "@/lib/constants";

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
      className={`hidden md:flex flex-col fixed top-0 left-0 h-screen transition-all duration-300 ${collapsed ? "w-16" : "w-80"
        }`}
      style={{ zIndex: Z_INDEX.sidebar }}
    >
      <div
        className="flex flex-col h-full m-3 mr-0 rounded-2xl glass glass-static overflow-hidden transition-all duration-500"
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
                className={`nav-link flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold ${collapsed ? "justify-center" : ""} ${
                  isActive
                    ? ""
                    : "hover:bg-[var(--surface-hover)]"
                }`}
                style={{
                  backgroundColor: isActive ? `${workspaceColor}15` : 'transparent',
                  color: isActive ? workspaceColor : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? `${workspaceColor}30` : 'transparent'}`,
                }}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <item.icon
                  size={20}
                  className={`flex-shrink-0 ${isActive ? "" : "text-[var(--text-muted)]"}`}
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
            className={`nav-link flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold ${collapsed ? "justify-center" : ""} ${
              pathname === "/settings" ? "" : "hover:bg-[var(--surface-hover)]"
            }`}
            style={{
              backgroundColor: pathname === "/settings" ? `${workspaceColor}15` : 'transparent',
              color: pathname === "/settings" ? workspaceColor : 'var(--text-secondary)',
              border: `1px solid ${pathname === "/settings" ? `${workspaceColor}30` : 'transparent'}`,
            }}
            title={collapsed ? "Settings" : undefined}
            aria-label="Settings"
          >
            <Settings size={20} className="flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <ThemeToggle collapsed={collapsed} />

          <button
            onClick={toggleCollapsed}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all duration-200 ${collapsed ? "justify-center" : ""
              }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
