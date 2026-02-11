"use client";

import { useState, useRef, useEffect } from "react";
import { X, BookOpen, Lightbulb, ClipboardList, FileText } from "lucide-react";
import { createNote, updateNote } from "@/actions/notes";
import type { Note } from "@/types";
import type { ProjectWithClient } from "@/actions/projects";

const NOTE_TYPE_OPTIONS = [
  { value: "general", label: "Note", icon: FileText, color: "#94a3b8" },
  { value: "daily_journal", label: "Journal", icon: BookOpen, color: "#84cc16" },
  { value: "meeting", label: "Meeting", icon: ClipboardList, color: "#38bdf8" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "#fbbf24" },
];

interface NoteFormModalProps {
  note?: Note | null;
  projects: ProjectWithClient[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function NoteFormModal({ note, projects, open, onClose, onSaved }: NoteFormModalProps) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = !!note;

  useEffect(() => {
    if (open) {
      setError("");
      setSaving(false);
      setTimeout(() => contentRef.current?.focus(), 100);
    }
  }, [open, note]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(formRef.current!);

    const result = isEditing
      ? await updateNote(note!.id, formData)
      : await createNote(formData);

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
      <div className="relative glass p-6 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            {isEditing ? "Edit Note" : "New Note"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Note Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {NOTE_TYPE_OPTIONS.map((t) => {
                const Icon = t.icon;
                return (
                  <label
                    key={t.value}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-hover)] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-muted)]"
                  >
                    <input
                      type="radio"
                      name="note_type"
                      value={t.value}
                      defaultChecked={note ? note.note_type === t.value : t.value === "general"}
                      className="sr-only"
                    />
                    <Icon size={16} style={{ color: t.color }} />
                    <span className="text-xs font-medium text-[var(--text-primary)]">{t.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="note-title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Title <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <input
              id="note-title"
              name="title"
              type="text"
              defaultValue={note?.title ?? ""}
              placeholder="Give your note a title..."
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="note-content" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Content <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              ref={contentRef}
              id="note-content"
              name="content"
              rows={8}
              required
              defaultValue={note?.content ?? ""}
              placeholder="Write your note... (supports **bold**, *italic*, and - bullet lists)"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Project */}
          <div>
            <label htmlFor="note-project" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Project
            </label>
            <select
              id="note-project"
              name="project_id"
              defaultValue={note?.project_id ?? ""}
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

          {/* Date */}
          <div>
            <label htmlFor="note-date" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Date
            </label>
            <input
              id="note-date"
              name="note_date"
              type="date"
              defaultValue={note?.note_date ?? new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Pinned toggle */}
          <div className="flex items-center gap-3">
            <input
              type="hidden"
              name="pinned"
              value="false"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => {
                  // Update the hidden input value
                  const hidden = e.target.closest("div")?.querySelector('input[type="hidden"]') as HTMLInputElement;
                  if (hidden) hidden.value = e.target.checked ? "true" : "false";
                }}
                defaultChecked={note?.pinned ?? false}
                className="w-4 h-4 rounded accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">Pin this note</span>
            </label>
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
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
