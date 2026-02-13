"use client";

import React from "react";
import { Target } from "lucide-react";
import type { TaskWithProject } from "@/actions/tasks";

interface FocusTaskProps {
  task: TaskWithProject | null;
}

const priorityLabels: Record<string, string> = {
  p1: "P1",
  p2: "P2",
  p3: "P3",
  p4: "P4",
};

const priorityColors: Record<string, string> = {
  p1: "#f87171",
  p2: "#fb923c",
  p3: "#fbbf24",
  p4: "#94a3b8",
};

export default React.memo(function FocusTask({ task }: FocusTaskProps) {
  if (!task) {
    return (
      <div
        className="glass p-5"
        style={{ borderRadius: "1.25rem" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} style={{ color: "var(--accent)" }} />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
            Focus Task
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          No tasks to focus on. Nice work!
        </p>
      </div>
    );
  }

  const dueLabel = task.due_date
    ? (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(task.due_date + "T00:00:00");
        const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: "var(--danger)" };
        if (diffDays === 0) return { text: "Due today", color: "var(--accent)" };
        if (diffDays === 1) return { text: "Due tomorrow", color: "var(--text-secondary)" };
        return { text: `Due in ${diffDays}d`, color: "var(--text-secondary)" };
      })()
    : null;

  return (
    <div
      className="glass p-5 animate-pulse-glow"
      style={{
        borderRadius: "1.25rem",
        borderColor: "var(--accent-glow)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} style={{ color: "var(--accent)" }} />
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
          Focus Task
        </span>
      </div>

      <div className="flex items-start gap-3">
        {/* Priority badge */}
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
          style={{
            color: priorityColors[task.priority],
            backgroundColor: priorityColors[task.priority] + "20",
          }}
        >
          {priorityLabels[task.priority]}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[var(--heading)] leading-snug">
            {task.title}
          </h3>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.projects && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.projects.color }}
                />
                {task.projects.name}
              </span>
            )}

            {task.status === "in_progress" && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  color: "var(--accent)",
                  backgroundColor: "var(--accent-muted)",
                }}
              >
                In Progress
              </span>
            )}

            {dueLabel && (
              <span className="text-xs font-medium" style={{ color: dueLabel.color }}>
                {dueLabel.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
