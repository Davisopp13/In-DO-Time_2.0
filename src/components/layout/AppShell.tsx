"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import ActiveTimerBanner from "@/components/timers/ActiveTimerBanner";
import FAB from "@/components/FAB";
import QuickAddTask from "@/components/QuickAddTask";
import type { ProjectWithClient } from "@/actions/projects";
import { getActiveProjects } from "@/actions/projects";

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggleCollapsed: () => { },
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Fetch projects for quick add (lazy, on demand)
  const openQuickAdd = useCallback(async () => {
    try {
      const p = await getActiveProjects();
      setProjects(p);
    } catch {
      // Use whatever we had before
    }
    setQuickAddOpen(true);
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openQuickAdd();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openQuickAdd]);

  const handleCloseQuickAdd = useCallback(() => {
    setQuickAddOpen(false);
  }, []);

  const handleCreated = useCallback(() => {
    router.refresh();
  }, [router]);

  const sidebarContextValue = useMemo(() => ({
    collapsed,
    toggleCollapsed
  }), [collapsed, toggleCollapsed]);

  // Don't show shell on login/auth pages
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="flex min-h-screen">
        <Sidebar />

        {/* Main content area - offset for sidebar on desktop */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-80"
            }`}
        >
          <TopBar />
          <ActiveTimerBanner />
          <main className="flex-1 px-4 pb-28 md:px-7 md:pb-7" style={{ paddingLeft: "max(1rem, var(--safe-area-left))", paddingRight: "max(1rem, var(--safe-area-right))" }}>
            {children}
          </main>
        </div>

        <MobileNav />

        {/* FAB for quick task creation (mobile only) */}
        <FAB onClick={openQuickAdd} />

        {/* Quick Add Modal */}
        <QuickAddTask
          open={quickAddOpen}
          onClose={handleCloseQuickAdd}
          onCreated={handleCreated}
          projects={projects}
        />
      </div>
    </SidebarContext.Provider>
  );
}
