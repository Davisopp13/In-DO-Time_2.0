"use client";

import { Calendar, Pencil, Trash2 } from "lucide-react";
import type { TaskWithProject } from "@/actions/tasks";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  p1: { label: "P1", color: "#f87171" },
  p2: { label: "P2", color: "#fb923c" },
  p3: { label: "P3", color: "#fbbf24" },
  p4: { label: "P4", color: "#94a3b8" },
};

interface TaskRowProps {
  task: TaskWithProject;
  onToggle: (id: string, currentStatus: string) => void;
  onEdit: (task: TaskWithProject) => void;
  onDelete: (id: string) => void;
}

function getDueDateInfo(dueDate: string | null): { label: string; className: string } | null {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, className: "text-[var(--danger)]" };
  }
  if (diffDays === 0) {
    return { label: "Today", className: "text-[var(--accent)]" };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", className: "text-[var(--accent)]" };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d`, className: "text-[var(--text-secondary)]" };
  }
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    className: "text-[var(--text-muted)]",
  };
}

export default function TaskRow({ task, onToggle, onEdit, onDelete }: TaskRowProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.p3;
  const isDone = task.status === "done";
  const dueDateInfo = !isDone ? getDueDateInfo(task.due_date) : null;

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] cursor-pointer ${
        isDone ? "opacity-60" : ""
      }`}
      onClick={() => onEdit(task)}
    >
      {/* Checkbox — 44px touch target */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.status); }}
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
        <p className={`text-sm font-medium truncate ${isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
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

      {/* Status badge for in_progress — hidden on mobile to save space */}
      {task.status === "in_progress" && (
        <span className="hidden sm:flex flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-muted)] text-[var(--accent)]">
          In Progress
        </span>
      )}

      {/* Due date — hidden on mobile to save space */}
      {dueDateInfo && (
        <div className={`hidden sm:flex flex-shrink-0 items-center gap-1 text-xs ${dueDateInfo.className}`}>
          <Calendar size={12} />
          {dueDateInfo.label}
        </div>
      )}

      {/* Actions — always visible on mobile, hover on desktop */}
      <div className="flex-shrink-0 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="Edit task"
          aria-label="Edit task"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--danger)]"
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
