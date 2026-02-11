"use client";

import { useState } from "react";
import { ListTodo, Loader, CheckCircle2 } from "lucide-react";
import type { TaskWithProject } from "@/actions/tasks";
import KanbanCard from "./KanbanCard";

const COLUMN_CONFIG: Record<string, { label: string; icon: typeof ListTodo }> = {
  todo: { label: "To Do", icon: ListTodo },
  in_progress: { label: "In Progress", icon: Loader },
  done: { label: "Done", icon: CheckCircle2 },
};

interface KanbanColumnProps {
  status: string;
  tasks: TaskWithProject[];
  onDrop: (taskId: string, newStatus: string) => void;
  onEdit: (task: TaskWithProject) => void;
}

export default function KanbanColumn({ status, tasks, onDrop, onEdit }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = COLUMN_CONFIG[status] ?? COLUMN_CONFIG.todo;
  const Icon = config.icon;

  return (
    <div
      className={`flex flex-col min-h-[400px] rounded-2xl border bg-[var(--surface)] backdrop-blur-xl transition-all ${
        isDragOver
          ? "border-dashed border-2 border-[var(--accent)]"
          : "border-[var(--border)]"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        // Only reset if leaving the column itself, not entering a child
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
          onDrop(taskId, status);
        }
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <Icon size={16} className="text-[var(--text-muted)]" />
        <span className="text-sm font-semibold text-[var(--heading)]">{config.label}</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-8">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}
