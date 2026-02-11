"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createTask, updateTask } from "@/actions/tasks";
import type { Task } from "@/types";
import type { ProjectWithClient } from "@/actions/projects";

const PRIORITY_OPTIONS = [
  { value: "p1", label: "P1", color: "#f87171", description: "Critical" },
  { value: "p2", label: "P2", color: "#fb923c", description: "High" },
  { value: "p3", label: "P3", color: "#fbbf24", description: "Medium" },
  { value: "p4", label: "P4", color: "#94a3b8", description: "Low" },
];

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface TaskFormModalProps {
  task?: Task | null;
  projects: ProjectWithClient[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskFormModal({ task, projects, open, onClose, onSaved }: TaskFormModalProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const isEditing = !!task;

  useEffect(() => {
    if (open) {
      setError("");
      setSaving(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open, task]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(formRef.current!);

    const result = isEditing
      ? await updateTask(task!.id, formData)
      : await createTask(formData);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error ?? "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="relative glass p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            {isEditing ? "Edit Task" : "New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              ref={titleRef}
              id="task-title"
              name="title"
              type="text"
              required
              defaultValue={task?.title ?? ""}
              placeholder="What needs to be done?"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Description
            </label>
            <textarea
              id="task-desc"
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
              placeholder="Additional details..."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="task-project" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Project
            </label>
            <select
              id="task-project"
              name="project_id"
              defaultValue={task?.project_id ?? ""}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">No project (standalone)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}{project.clients ? ` (${project.clients.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <label
                  key={p.value}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-hover)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-muted)]"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    defaultChecked={task ? task.priority === p.value : p.value === "p3"}
                    className="sr-only"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{p.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{p.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Status
              </label>
              <select
                id="task-status"
                name="status"
                defaultValue={task?.status ?? "todo"}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label htmlFor="task-due" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Due Date
            </label>
            <input
              id="task-due"
              name="due_date"
              type="date"
              defaultValue={task?.due_date ?? ""}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-full bg-[var(--accent)] text-white font-medium text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
