"use client";

import { useState, useCallback, useMemo } from "react";
import { CheckSquare, Calendar } from "lucide-react";
import { toggleTaskStatus } from "@/actions/tasks";
import { useRouter } from "next/navigation";
import type { TaskWithProject } from "@/actions/tasks";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  p1: { label: "P1", color: "#f87171" },
  p2: { label: "P2", color: "#fb923c" },
  p3: { label: "P3", color: "#fbbf24" },
  p4: { label: "P4", color: "#94a3b8" },
};

function getDueDateInfo(dueDate: string | null): { label: string; color: string } | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: "var(--danger)" };
  if (diffDays === 0) return { label: "Today", color: "var(--accent)" };
  if (diffDays === 1) return { label: "Tomorrow", color: "var(--text-secondary)" };
  return { label: `${diffDays}d`, color: "var(--text-secondary)" };
}

interface DashboardTaskListProps {
  tasks: TaskWithProject[];
}

export default function DashboardTaskList({ tasks: initialTasks }: DashboardTaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const router = useRouter();

  // Sort: in_progress first, then todo by priority, done at bottom
  const priorityOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };
  const statusOrder: Record<string, number> = { in_progress: 0, todo: 1, done: 2 };

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
    if (statusDiff !== 0) return statusDiff;
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
  }), [tasks]);

  const handleToggle = useCallback(async function handleToggle(taskId: string, currentStatus: string) {
    const newStatus = (currentStatus === "done" ? "todo" : "done") as "todo" | "done";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === "done" ? new Date().toISOString() : null,
        };
      })
    );

    const result = await toggleTaskStatus(taskId, currentStatus);
    if (!result.success) {
      // Revert
      const revertStatus = currentStatus as "todo" | "in_progress" | "done";
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return { ...t, status: revertStatus, completed_at: revertStatus === "done" ? t.completed_at : null };
        })
      );
    } else {
      router.refresh();
    }
  }, [router]);

  return (
    <div
      className="glass p-5"
      style={{ borderRadius: "1.25rem" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare size={16} style={{ color: "var(--accent)" }} />
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
          ▲ Today&apos;s Tasks
        </span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {tasks.filter((t) => t.status === "done").length}/{tasks.length} done
        </span>
      </div>

      {sortedTasks.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No tasks for today. Enjoy the free time!
        </p>
      ) : (
        <div className="space-y-1.5">
          {sortedTasks.map((task) => {
            const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.p3;
            const isDone = task.status === "done";
            const dueDateInfo = !isDone ? getDueDateInfo(task.due_date) : null;

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-[var(--surface-hover)] ${
                  isDone ? "opacity-50" : ""
                }`}
              >
                {/* Checkbox — 44px touch target */}
                <button
                  onClick={() => handleToggle(task.id, task.status)}
                  className="flex-shrink-0 flex items-center justify-center w-11 h-11 -m-1.5"
                  aria-label={isDone ? "Mark task incomplete" : "Mark task complete"}
                >
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-[var(--accent)] border-[var(--accent)]"
                      : "border-[var(--text-muted)] hover:border-[var(--accent)]"
                  }`}>
                    {isDone && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Priority badge */}
                <span
                  className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: priority.color + "20",
                    color: priority.color,
                  }}
                >
                  {priority.label}
                </span>

                {/* Title + Project */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.projects && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.projects.color }}
                      />
                      <span className="text-xs text-[var(--text-muted)] truncate">
                        {task.projects.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* In Progress badge */}
                {task.status === "in_progress" && (
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-muted)] text-[var(--accent)]">
                    In Progress
                  </span>
                )}

                {/* Due date */}
                {dueDateInfo && (
                  <div className="flex-shrink-0 flex items-center gap-1 text-xs" style={{ color: dueDateInfo.color }}>
                    <Calendar size={12} />
                    {dueDateInfo.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
