"use client";

import { BookOpen, Lightbulb, ClipboardList, FileText, Pin, Pencil, Trash2 } from "lucide-react";
import type { NoteWithProject } from "@/actions/notes";

const NOTE_TYPE_CONFIG: Record<string, { icon: typeof BookOpen; label: string; color: string }> = {
  daily_journal: { icon: BookOpen, label: "Journal", color: "#84cc16" },
  idea: { icon: Lightbulb, label: "Idea", color: "#fbbf24" },
  meeting: { icon: ClipboardList, label: "Meeting", color: "#38bdf8" },
  general: { icon: FileText, label: "Note", color: "#94a3b8" },
};

function renderMarkdown(text: string): string {
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    // Italic: *text* or _text_
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, "<em>$1</em>")
    // Unordered list items: - item or * item
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n/g, "<br/>");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

interface NoteCardProps {
  note: NoteWithProject;
  onEdit: (note: NoteWithProject) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  const config = NOTE_TYPE_CONFIG[note.note_type] ?? NOTE_TYPE_CONFIG.general;
  const Icon = config.icon;

  const contentPreview = note.content.length > 200
    ? note.content.slice(0, 200) + "..."
    : note.content;

  return (
    <div
      className="glass p-4 cursor-pointer hover:border-[var(--border-hover)] transition-all group"
      style={{
        borderRadius: "1.25rem",
        borderLeft: note.pinned ? "3px solid var(--accent)" : undefined,
      }}
      onClick={() => onEdit(note)}
    >
      {/* Header row: type icon + badges + actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type icon */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${config.color}20`,
              color: config.color,
            }}
          >
            <Icon size={12} />
            {config.label}
          </div>

          {/* Project badge */}
          {note.projects && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: note.projects.color }}
              />
              {note.projects.name}
            </div>
          )}

          {/* Pinned indicator */}
          {note.pinned && (
            <Pin size={12} className="text-[var(--accent)]" />
          )}
        </div>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id, note.pinned);
            }}
            className={`p-2 md:p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors ${
              note.pinned ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="p-2 md:p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="p-2 md:p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title (if present) */}
      {note.title && (
        <h3 className="text-sm font-semibold text-[var(--heading)] mb-1">
          {note.title}
        </h3>
      )}

      {/* Content preview with basic markdown */}
      <div
        className="text-sm text-[var(--text-secondary)] leading-relaxed [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)] [&_em]:italic [&_li]:ml-4 [&_li]:list-disc"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(contentPreview) }}
      />

      {/* Date */}
      <p className="text-xs text-[var(--text-muted)] mt-2">
        {formatDate(note.note_date)}
      </p>
    </div>
  );
}
