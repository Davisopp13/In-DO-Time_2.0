"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

const POLL_INTERVAL = 45_000; // 45 seconds

interface UseSyncOptions {
  /** Called to perform the actual data fetch/sync */
  onSync: () => Promise<void>;
  /** Enable polling. Default true */
  enablePolling?: boolean;
  /** Enable sync on window focus. Default true */
  enableFocusSync?: boolean;
}

export function useSync({
  onSync,
  enablePolling = true,
  enableFocusSync = true,
}: UseSyncOptions) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const { isOnline } = useOnlineStatus();
  const syncingRef = useRef(false);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  // Track online status
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus("offline");
    } else if (syncStatus === "offline") {
      // Came back online — trigger sync
      performSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const performSync = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;
    syncingRef.current = true;
    setSyncStatus("syncing");

    try {
      await onSyncRef.current();
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("[sync] Error during sync:", err);
      setSyncStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [isOnline]);

  // Polling interval
  useEffect(() => {
    if (!enablePolling || !isOnline) return;
    const id = setInterval(performSync, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [enablePolling, isOnline, performSync]);

  // Sync on focus
  useEffect(() => {
    if (!enableFocusSync) return;
    const handleFocus = () => {
      if (isOnline) performSync();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [enableFocusSync, isOnline, performSync]);

  // Sync on visibility change (back from background on mobile)
  useEffect(() => {
    if (!enableFocusSync) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isOnline) {
        performSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enableFocusSync, isOnline, performSync]);

  return {
    syncStatus,
    lastSyncedAt,
    isOnline,
    triggerSync: performSync,
  };
}
