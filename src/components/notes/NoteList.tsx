"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, FileText } from "lucide-react";
import type { NoteWithProject } from "@/actions/notes";
import { toggleNotePin, deleteNote } from "@/actions/notes";
import type { ProjectWithClient } from "@/actions/projects";
import NoteCard from "./NoteCard";
import NoteFormModal from "./NoteFormModal";

type TypeFilter = "all" | "general" | "daily_journal" | "meeting" | "idea";

const FILTER_PILLS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "daily_journal", label: "Journal" },
  { value: "idea", label: "Ideas" },
  { value: "meeting", label: "Meetings" },
  { value: "general", label: "Notes" },
];

interface NoteListProps {
  initialNotes: NoteWithProject[];
  projects: ProjectWithClient[];
}

export default function NoteList({ initialNotes, projects }: NoteListProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithProject | null>(null);

  const projectFilteredNotes = useMemo(
    () => projectFilter === "all" ? notes : notes.filter((n) => n.project_id === projectFilter),
    [notes, projectFilter]
  );

  const filteredNotes = useMemo(
    () => typeFilter === "all" ? projectFilteredNotes : projectFilteredNotes.filter((n) => n.note_type === typeFilter),
    [projectFilteredNotes, typeFilter]
  );

  const counts = useMemo(() => ({
    all: projectFilteredNotes.length,
    daily_journal: projectFilteredNotes.filter((n) => n.note_type === "daily_journal").length,
    idea: projectFilteredNotes.filter((n) => n.note_type === "idea").length,
    meeting: projectFilteredNotes.filter((n) => n.note_type === "meeting").length,
    general: projectFilteredNotes.filter((n) => n.note_type === "general").length,
  }), [projectFilteredNotes]);

  const handleEdit = useCallback((note: NoteWithProject) => {
    setEditingNote(note);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteNote(id);
    if (result.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }, []);

  const handleTogglePin = useCallback(async (id: string, currentPinned: boolean) => {
    // Optimistic update
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, pinned: !currentPinned } : n
      );
      // Re-sort: pinned first, then by date
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.note_date).getTime() - new Date(a.note_date).getTime();
      });
    });

    const result = await toggleNotePin(id, currentPinned);
    if (!result.success) {
      // Revert on error
      setNotes((prev) => {
        const reverted = prev.map((n) =>
          n.id === id ? { ...n, pinned: currentPinned } : n
        );
        return reverted.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.note_date).getTime() - new Date(a.note_date).getTime();
        });
      });
    }
  }, []);

  const handleSaved = useCallback(() => {
    window.location.reload();
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingNote(null);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="trail-marker">Notes</p>
          <h1 className="text-2xl font-semibold text-[var(--heading)] mt-1">
            Notes & Journal
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingNote(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)]"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {/* Type filter pills */}
        {FILTER_PILLS.map((pill) => {
          const isActive = typeFilter === pill.value;
          const count = counts[pill.value];
          return (
            <button
              key={pill.value}
              onClick={() => setTypeFilter(pill.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              {pill.label}
              <span className={`text-xs ${isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Project filter dropdown */}
        {projects.length > 0 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all appearance-none cursor-pointer pr-7 outline-none focus:border-[var(--accent)]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Notes feed */}
      {filteredNotes.length === 0 ? (
        <div className="glass p-8 text-center" style={{ borderRadius: "1.25rem" }}>
          <FileText size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">
            {typeFilter === "all" && projectFilter === "all"
              ? "No notes yet. Create your first note to get started."
              : `No ${typeFilter === "all" ? "" : (FILTER_PILLS.find((p) => p.value === typeFilter)?.label?.toLowerCase() + " ")}notes${projectFilter !== "all" ? " for this project" : ""}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <NoteFormModal
        note={editingNote}
        projects={projects}
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
