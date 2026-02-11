"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import ActiveTimerBanner from "@/components/timers/ActiveTimerBanner";

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
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Don't show shell on login/auth pages
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>
      <div className="flex min-h-screen">
        <Sidebar />

        {/* Main content area - offset for sidebar on desktop */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-80"
            }`}
        >
          <TopBar />
          <ActiveTimerBanner />
          <main className="flex-1 px-4 pb-24 md:px-7 md:pb-7">
            {children}
          </main>
        </div>

        <MobileNav />
      </div>
    </SidebarContext.Provider>
  );
}
