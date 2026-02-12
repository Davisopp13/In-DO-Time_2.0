"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import WorkspaceSelector from "./WorkspaceSelector";
import ThemeToggle from "./ThemeToggle";
import SyncStatus from "@/components/SyncStatus";
import { useSyncContext } from "@/lib/sync";
import { Z_INDEX } from "@/lib/constants";

export default function TopBar() {
  const { syncStatus, lastSyncedAt, triggerSync } = useSyncContext();

  return (
    <header
      className="sticky top-0 px-4 py-3 md:px-6"
      style={{ zIndex: Z_INDEX.header, paddingTop: "max(0.75rem, var(--safe-area-top))" }}
    >
      <div className="glass flex items-center justify-between px-4 py-2.5 rounded-2xl">
        {/* Mobile logo */}
        <div className="flex items-center md:hidden">
          <div className="relative w-28 h-8">
            <Image
              src="/In_DO_Time_Logo.png"
              alt="In DO Time Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="flex flex-1 md:flex-initial">
          <WorkspaceSelector />
        </div>

        {/* Search placeholder */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-hover)] transition-all cursor-pointer">
          <Search size={14} />
          <span className="text-xs">Search...</span>
          <kbd className="ml-auto text-[0.6rem] px-1 rounded-md border border-[var(--border)]">
            ⌘K
          </kbd>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <SyncStatus
            status={syncStatus}
            lastSyncedAt={lastSyncedAt}
            onManualSync={triggerSync}
          />
          <div className="md:hidden">
            <ThemeToggle collapsed />
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-[var(--accent)] text-sm font-semibold select-none">
            D
          </div>
        </div>
      </div>
    </header>
  );
}
