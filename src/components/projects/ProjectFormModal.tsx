"use client";

import { useState, useRef, useEffect } from "react";
import { X, Ship, Code, User, Bot } from "lucide-react";
import { createProject, updateProject } from "@/actions/projects";
import type { Project, Client, Workspace } from "@/types";

const iconMap: Record<string, any> = {
  Ship,
  Code,
  User,
  Bot,
};

const COLOR_OPTIONS = [
  "#84cc16", "#38bdf8", "#c084fc", "#fb923c",
  "#f87171", "#fbbf24", "#34d399", "#818cf8",
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

interface ProjectFormModalProps {
  project?: Project | null;
  clients: Client[];
  workspaces: Workspace[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProjectFormModal({ project, clients, workspaces, open, onClose, onSaved }: ProjectFormModalProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState(project?.color ?? "#84cc16");
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEditing = !!project;

  useEffect(() => {
    if (open) {
      setError("");
      setSaving(false);
      setSelectedColor(project?.color ?? "#84cc16");
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open, project]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(formRef.current!);
    formData.set("color", selectedColor);

    const result = isEditing
      ? await updateProject(project!.id, formData)
      : await createProject(formData);

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
            {isEditing ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              ref={nameRef}
              id="project-name"
              name="name"
              type="text"
              required
              defaultValue={project?.name ?? ""}
              placeholder="Project name"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Workspace */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Workspace <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workspaces.map((ws) => {
                const Icon = iconMap[ws.icon || "User"] || User;
                return (
                  <label
                    key={ws.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-hover)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-muted)]"
                  >
                    <input
                      type="radio"
                      name="workspace_id"
                      value={ws.id}
                      required
                      defaultChecked={project ? project.workspace_id === ws.id : false}
                      className="sr-only"
                    />
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: ws.color }}
                    >
                      <Icon size={12} />
                    </div>
                    <span className="text-sm text-[var(--text-primary)] truncate">{ws.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="project-desc" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Description
            </label>
            <textarea
              id="project-desc"
              name="description"
              rows={3}
              defaultValue={project?.description ?? ""}
              placeholder="What is this project about?"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Client */}
          <div>
            <label htmlFor="project-client" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Client
            </label>
            <select
              id="project-client"
              name="client_id"
              defaultValue={project?.client_id ?? ""}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">No client (standalone)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div>
              <label htmlFor="project-status" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Status
              </label>
              <select
                id="project-status"
                name="status"
                defaultValue={project?.status ?? "active"}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hourly Rate Override */}
          <div>
            <label htmlFor="project-rate" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Hourly Rate Override ($)
            </label>
            <input
              id="project-rate"
              name="hourly_rate_override"
              type="number"
              step="0.01"
              min="0"
              defaultValue={project?.hourly_rate_override ?? ""}
              placeholder="Leave blank to use client rate"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "var(--heading)" : "transparent",
                    transform: selectedColor === color ? "scale(1.15)" : "scale(1)",
                  }}
                  title={color}
                />
              ))}
            </div>
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
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
