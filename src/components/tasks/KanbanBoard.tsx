"use client";

import { useCallback } from "react";
import type { TaskWithProject } from "@/actions/tasks";
import { updateTaskStatus } from "@/actions/tasks";
import KanbanColumn from "./KanbanColumn";

const COLUMNS: string[] = ["todo", "in_progress", "done"];

const priorityOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };

interface KanbanBoardProps {
  tasks: TaskWithProject[];
  onTasksChange: (updater: (prev: TaskWithProject[]) => TaskWithProject[]) => void;
  onEdit: (task: TaskWithProject) => void;
}

export default function KanbanBoard({ tasks, onTasksChange, onEdit }: KanbanBoardProps) {
  const handleDrop = useCallback(
    async (taskId: string, newStatus: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      // Optimistic update
      onTasksChange((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus as "todo" | "in_progress" | "done",
                completed_at: newStatus === "done" ? new Date().toISOString() : null,
              }
            : t
        )
      );

      const result = await updateTaskStatus(taskId, newStatus);
      if (!result.success) {
        // Revert on error
        onTasksChange((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: task.status, completed_at: task.completed_at } : t
          )
        );
      }
    },
    [tasks, onTasksChange]
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map((status) => {
        const columnTasks = tasks
          .filter((t) => t.status === status)
          .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

        return (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks}
            onDrop={handleDrop}
            onEdit={onEdit}
          />
        );
      })}
    </div>
  );
}
