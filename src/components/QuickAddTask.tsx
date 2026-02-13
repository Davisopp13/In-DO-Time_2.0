"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Folder,
  Calendar,
  Flag,
  Tag,
  User,
} from "lucide-react";
import { createTask } from "@/actions/tasks";
import { useToast } from "@/lib/toast";
import { useWorkspace } from "@/lib/workspace";
import { Z_INDEX } from "@/lib/constants";
import { parseTaskInput } from "@/utils/parseTaskInput";
import { buildProjectAliasMap } from "@/hooks/useProjectAliases";
import type { ProjectWithClient } from "@/actions/projects";

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
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { currentWorkspace } = useWorkspace();

  // Filter projects by current workspace
  const workspaceProjects = useMemo(
    () =>
      projects.filter(
        (p) => !currentWorkspace || p.workspace_id === currentWorkspace.id
      ),
    [projects, currentWorkspace]
  );

  // Build alias map from workspace projects
  const projectAliases = useMemo(
    () => buildProjectAliasMap(workspaceProjects),
    [workspaceProjects]
  );

  // Live parse the input
  const parsed = useMemo(
    () => parseTaskInput(input, { projectAliases }),
    [input, projectAliases]
  );

  // Resolve project name for display
  const resolvedProjectName = useMemo(() => {
    if (!parsed.project) return null;
    const match = workspaceProjects.find((p) => p.id === parsed.project);
    if (match) return match.name;
    // If not resolved to an ID, show the raw name
    return parsed.project;
  }, [parsed.project, workspaceProjects]);

  // Format due date for display
  const formattedDate = useMemo(() => {
    if (!parsed.due_date) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (parsed.due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 7 && diff > 0) {
      return parsed.due_date.toLocaleDateString("en-US", { weekday: "long" });
    }
    return parsed.due_date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, [parsed.due_date]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setInput("");
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

  // Escape to close
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
      const trimmedTitle = parsed.title.trim();
      if (!trimmedTitle) return;

      setSaving(true);
      const formData = new FormData();
      formData.set("title", trimmedTitle);

      // Map parsed priority to p1-p4
      if (parsed.priority === "high") formData.set("priority", "p1");
      else if (parsed.priority === "medium") formData.set("priority", "p2");
      else if (parsed.priority === "low") formData.set("priority", "p4");
      else formData.set("priority", "p3");

      // Set project if resolved to an ID
      if (parsed.project) {
        const match = workspaceProjects.find((p) => p.id === parsed.project);
        if (match) formData.set("project_id", match.id);
      }

      // Set due date
      if (parsed.due_date) {
        const y = parsed.due_date.getFullYear();
        const m = String(parsed.due_date.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.due_date.getDate()).padStart(2, "0");
        formData.set("due_date", `${y}-${m}-${d}`);
      }

      formData.set("status", "todo");

      const result = await createTask(formData);

      if (result.success) {
        showToast("success", "Task created", trimmedTitle);
        onCreated?.();
        onClose();
      } else {
        showToast("error", "Error", result.error ?? "Failed to create task");
        setSaving(false);
      }
    },
    [parsed, workspaceProjects, showToast, onCreated, onClose]
  );

  if (!mounted || !open) return null;

  const hasParsedContent =
    resolvedProjectName ||
    formattedDate ||
    parsed.priority ||
    parsed.tags.length > 0 ||
    parsed.assignee;

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
          transform: visible ? "translateY(0)" : "translateY(100%)",
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
            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-base"
              autoComplete="off"
            />

            {/* Syntax hints */}
            <p className="mt-2 text-[11px] text-[var(--text-muted)] leading-relaxed">
              Try: <span className="text-[var(--text-secondary)]">@project</span>{" "}
              <span className="text-[var(--text-secondary)]">#tag</span>{" "}
              <span className="text-[var(--text-secondary)]">tomorrow</span>{" "}
              <span className="text-[var(--text-secondary)]">!!</span>{" "}
              <span className="text-[var(--text-secondary)]">+assignee</span>
            </p>

            {/* Live parsing preview */}
            {input.trim() && (
              <div className="mt-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                {/* Parsed title */}
                {parsed.title && (
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {parsed.title}
                  </p>
                )}

                {/* Badges */}
                {hasParsedContent && (
                  <div className="flex flex-wrap gap-1.5">
                    {/* Project badge */}
                    {resolvedProjectName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        <Folder size={11} />
                        {resolvedProjectName}
                      </span>
                    )}

                    {/* Due date badge */}
                    {formattedDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                        <Calendar size={11} />
                        {formattedDate}
                      </span>
                    )}

                    {/* Priority badge */}
                    {parsed.priority && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          parsed.priority === "high"
                            ? "bg-red-500/15 text-red-400 border-red-500/20"
                            : parsed.priority === "medium"
                              ? "bg-orange-500/15 text-orange-400 border-orange-500/20"
                              : "bg-slate-500/15 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        <Flag size={11} />
                        {parsed.priority}
                      </span>
                    )}

                    {/* Tag badges */}
                    {parsed.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]/20"
                      >
                        <Tag size={11} />
                        #{tag}
                      </span>
                    ))}

                    {/* Assignee badge */}
                    {parsed.assignee && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">
                        <User size={11} />
                        {parsed.assignee}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!parsed.title.trim() || saving}
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
