"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { useSync, type SyncStatus } from "@/hooks/useSync";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useRouter } from "next/navigation";

interface SyncContextValue {
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const refreshData = useCallback(async () => {
    // Use Next.js router.refresh() to re-fetch server components
    router.refresh();
  }, [router]);

  const { syncStatus, lastSyncedAt, isOnline, triggerSync } = useSync({
    onSync: refreshData,
  });

  // Real-time subscriptions — trigger refresh on any data change
  useRealtimeSync({
    onDataChange: () => {
      refreshData();
    },
    enabled: isOnline,
  });

  const value = useMemo(
    () => ({ syncStatus, lastSyncedAt, isOnline, triggerSync }),
    [syncStatus, lastSyncedAt, isOnline, triggerSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }
  return context;
}
