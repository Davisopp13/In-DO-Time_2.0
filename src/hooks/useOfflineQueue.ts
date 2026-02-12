"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { openDB, type IDBPDatabase } from "idb";
import { useOnlineStatus } from "./useOnlineStatus";

interface QueuedMutation {
  id: string;
  table: string;
  action: "create" | "update" | "delete";
  payload: Record<string, any>;
  createdAt: number;
}

const DB_NAME = "in-do-time-offline";
const DB_VERSION = 1;
const STORE_NAME = "mutations";

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

interface UseOfflineQueueOptions {
  /** Called to process a single queued mutation */
  processMutation: (mutation: QueuedMutation) => Promise<boolean>;
  /** Called when the queue is fully flushed */
  onQueueFlushed?: () => void;
}

export function useOfflineQueue({
  processMutation,
  onQueueFlushed,
}: UseOfflineQueueOptions) {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const flushingRef = useRef(false);
  const processMutationRef = useRef(processMutation);
  processMutationRef.current = processMutation;

  const refreshCount = useCallback(async () => {
    try {
      const db = await getDB();
      const count = await db.count(STORE_NAME);
      setPendingCount(count);
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  // Enqueue a mutation when offline
  const enqueue = useCallback(
    async (mutation: Omit<QueuedMutation, "id" | "createdAt">) => {
      try {
        const db = await getDB();
        const entry: QueuedMutation = {
          ...mutation,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: Date.now(),
        };
        await db.add(STORE_NAME, entry);
        await refreshCount();
      } catch (err) {
        console.error("[offline-queue] Failed to enqueue:", err);
      }
    },
    [refreshCount]
  );

  // Flush all queued mutations
  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;

    try {
      const db = await getDB();
      const allMutations = await db.getAll(STORE_NAME);

      if (allMutations.length === 0) {
        flushingRef.current = false;
        return;
      }

      // Sort by creation time (oldest first)
      allMutations.sort((a, b) => a.createdAt - b.createdAt);

      let flushedCount = 0;
      for (const mutation of allMutations) {
        try {
          const success = await processMutationRef.current(mutation);
          if (success) {
            await db.delete(STORE_NAME, mutation.id);
            flushedCount++;
          }
        } catch (err) {
          console.error("[offline-queue] Failed to process mutation:", mutation.id, err);
          // Stop on first failure to preserve order
          break;
        }
      }

      await refreshCount();

      if (flushedCount > 0 && (await db.count(STORE_NAME)) === 0) {
        onQueueFlushed?.();
      }
    } catch (err) {
      console.error("[offline-queue] Flush error:", err);
    } finally {
      flushingRef.current = false;
    }
  }, [refreshCount, onQueueFlushed]);

  // Auto-flush when coming back online
  useEffect(() => {
    if (isOnline) {
      flush();
    }
  }, [isOnline, flush]);

  // Initial count
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return { enqueue, flush, pendingCount };
}

export type { QueuedMutation };
