"use client";

import { Calendar } from "lucide-react";
import type { TaskWithProject } from "@/actions/tasks";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  p1: { label: "P1", color: "#f87171" },
  p2: { label: "P2", color: "#fb923c" },
  p3: { label: "P3", color: "#fbbf24" },
  p4: { label: "P4", color: "#94a3b8" },
};

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

interface KanbanCardProps {
  task: TaskWithProject;
  onEdit: (task: TaskWithProject) => void;
}

export default function KanbanCard({ task, onEdit }: KanbanCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.p3;
  const isDone = task.status === "done";
  const dueDateInfo = !isDone ? getDueDateInfo(task.due_date) : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onClick={() => onEdit(task)}
      className={`p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] cursor-grab active:cursor-grabbing ${
        isDone ? "opacity-60" : ""
      }`}
    >
      {/* Priority badge + due date row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{
            backgroundColor: priority.color + "20",
            color: priority.color,
          }}
        >
          {priority.label}
        </span>
        {dueDateInfo && (
          <div className={`flex items-center gap-1 text-[10px] ${dueDateInfo.className}`}>
            <Calendar size={10} />
            {dueDateInfo.label}
          </div>
        )}
      </div>

      {/* Title (max 3 lines) */}
      <p
        className={`text-sm font-medium mb-1.5 ${
          isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"
        }`}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {task.title}
      </p>

      {/* Project tag */}
      {task.projects && (
        <div className="flex items-center gap-1.5 mt-2">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.projects.color }}
          />
          <span className="text-[10px] text-[var(--text-muted)] truncate">
            {task.projects.name}
          </span>
        </div>
      )}
    </div>
  );
}
