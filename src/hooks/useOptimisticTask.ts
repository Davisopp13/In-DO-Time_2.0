"use client";

import { useState, useCallback, useRef } from "react";
import { toggleTaskStatus, updateTaskStatus, deleteTask } from "@/actions/tasks";
import type { TaskWithProject } from "@/actions/tasks";
import { useOfflineQueue, type QueuedMutation } from "./useOfflineQueue";
import { useOnlineStatus } from "./useOnlineStatus";

interface UseOptimisticTasksOptions {
  initialTasks: TaskWithProject[];
  onSyncComplete?: () => void;
}

export function useOptimisticTasks({
  initialTasks,
  onSyncComplete,
}: UseOptimisticTasksOptions) {
  const [tasks, setTasks] = useState<TaskWithProject[]>(initialTasks);
  const { isOnline } = useOnlineStatus();

  // Keep tasks in sync with server data when it refreshes
  const lastServerDataRef = useRef(initialTasks);
  if (initialTasks !== lastServerDataRef.current) {
    lastServerDataRef.current = initialTasks;
    setTasks(initialTasks);
  }

  // Process offline mutations
  const processMutation = useCallback(
    async (mutation: QueuedMutation): Promise<boolean> => {
      try {
        if (mutation.action === "update" && mutation.payload.status) {
          const result = await updateTaskStatus(
            mutation.payload.id,
            mutation.payload.status
          );
          return result.success;
        }
        if (mutation.action === "delete") {
          const result = await deleteTask(mutation.payload.id);
          return result.success;
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const { enqueue, pendingCount } = useOfflineQueue({
    processMutation,
    onQueueFlushed: onSyncComplete,
  });

  // Optimistic toggle (complete/uncomplete)
  const optimisticToggle = useCallback(
    async (taskId: string, currentStatus: string) => {
      const newStatus = currentStatus === "done" ? "todo" : "done";

      // Optimistic local update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus as TaskWithProject["status"],
                completed_at: newStatus === "done" ? new Date().toISOString() : null,
              }
            : t
        )
      );

      if (isOnline) {
        const result = await toggleTaskStatus(taskId, currentStatus);
        if (!result.success) {
          // Revert on failure
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, status: currentStatus as TaskWithProject["status"] }
                : t
            )
          );
        }
      } else {
        // Queue for later
        await enqueue({
          table: "tasks",
          action: "update",
          payload: { id: taskId, status: newStatus },
        });
      }
    },
    [isOnline, enqueue]
  );

  // Optimistic delete
  const optimisticDelete = useCallback(
    async (taskId: string) => {
      const removedTask = tasks.find((t) => t.id === taskId);

      // Optimistic local removal
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      if (isOnline) {
        const result = await deleteTask(taskId);
        if (!result.success && removedTask) {
          // Revert on failure
          setTasks((prev) => [...prev, removedTask]);
        }
      } else {
        await enqueue({
          table: "tasks",
          action: "delete",
          payload: { id: taskId },
        });
      }
    },
    [isOnline, tasks, enqueue]
  );

  return {
    tasks,
    optimisticToggle,
    optimisticDelete,
    pendingCount,
  };
}
