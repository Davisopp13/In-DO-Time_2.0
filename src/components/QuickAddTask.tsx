"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Calendar, Flag } from "lucide-react";
import { createTask } from "@/actions/tasks";
import { useToast } from "@/lib/toast";
import { useWorkspace } from "@/lib/workspace";
import { Z_INDEX } from "@/lib/constants";
import type { ProjectWithClient } from "@/actions/projects";

const PRIORITY_OPTIONS = [
  { value: "p1", label: "P1", color: "#f87171" },
  { value: "p2", label: "P2", color: "#fb923c" },
  { value: "p3", label: "P3", color: "#fbbf24" },
  { value: "p4", label: "P4", color: "#94a3b8" },
];

interface QuickAddTaskProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  projects: ProjectWithClient[];
}

export default function QuickAddTask({
  open,
  onClose,
  onCreated,
  projects,
}: QuickAddTaskProps) {
  const [title, setTitle] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priority, setPriority] = useState("p3");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { currentWorkspace } = useWorkspace();

  // Filter projects by current workspace
  const workspaceProjects = projects.filter(
    (p) => !currentWorkspace || p.workspace_id === currentWorkspace.id
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTitle("");
      setShowAdvanced(false);
      setPriority("p3");
      setProjectId("");
      setDueDate("");
      setSaving(false);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        });
      });
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keyboard shortcut to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      setSaving(true);
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("priority", priority);
      if (projectId) formData.set("project_id", projectId);
      if (dueDate) formData.set("due_date", dueDate);
      formData.set("status", "todo");

      const result = await createTask(formData);

      if (result.success) {
        showToast("success", "Task created", title.trim());
        onCreated?.();
        onClose();
      } else {
        showToast("error", "Error", result.error ?? "Failed to create task");
        setSaving(false);
      }
    },
    [title, priority, projectId, dueDate, showToast, onCreated, onClose]
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: Z_INDEX.modal }}
      role="dialog"
      aria-modal="true"
      aria-label="Quick add task"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="absolute bottom-0 left-0 right-0 sm:relative sm:top-1/4 sm:mx-auto sm:max-w-lg sm:bottom-auto transition-all duration-300 ease-out"
        style={{
          transform: visible
            ? "translateY(0)"
            : "translateY(100%)",
        }}
      >
        <div
          className="p-5 sm:rounded-2xl rounded-t-2xl"
          style={{
            background: "var(--surface)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid var(--border)",
            borderBottom: "none",
            paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--heading)]">
              Quick Add Task
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title input */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-base"
              autoComplete="off"
            />

            {/* Quick options bar */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Priority pills */}
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all min-h-[32px] ${
                    priority === p.value
                      ? "border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)]"
                      : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </button>
              ))}

              {/* Toggle advanced */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                More
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Advanced options (collapsible) */}
            {showAdvanced && (
              <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Project */}
                <div className="flex items-center gap-2">
                  <Flag size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">No project</option>
                    {workspaceProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due date */}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="w-full mt-4 py-3 px-4 rounded-full bg-[var(--accent)] text-white font-semibold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px]"
            >
              {saving ? "Creating..." : "Add Task"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
