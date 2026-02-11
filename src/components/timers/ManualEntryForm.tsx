"use client";

import { useState } from "react";
import { X, ClipboardPen } from "lucide-react";
import { createManualTimeEntry } from "@/actions/time-entries";
import type { ProjectWithClient } from "@/actions/projects";



function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ManualEntryForm({
  projects,
  onClose,
  onCreated,
}: {
  projects: ProjectWithClient[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [date, setDate] = useState(getTodayStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Group projects by client
  const grouped = new Map<string, ProjectWithClient[]>();
  for (const project of projects) {
    const key = project.clients?.name || "No Client";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(project);
  }

  // Calculate duration preview
  function getDurationPreview(): string {
    if (!startTime || !endTime) return "";
    const s = new Date(`2000-01-01T${startTime}`);
    const e = new Date(`2000-01-01T${endTime}`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
    const diffMs = e.getTime() - s.getTime();
    if (diffMs <= 0) return "End must be after start";
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a project");
      return;
    }
    if (!date || !startTime || !endTime) {
      setError("Date, start time, and end time are required");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.set("project_id", selectedProjectId);
    formData.set("date", date);
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);
    formData.set("notes", notes);

    const result = await createManualTimeEntry(formData);
    if (result.success) {
      onCreated();
      onClose();
    } else {
      setError(result.error || "Failed to create time entry");
    }
    setLoading(false);
  }

  const durationPreview = getDurationPreview();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div
        className="glass relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
      >
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ClipboardPen size={20} style={{ color: "var(--accent)" }} />
              <h2 className="text-lg font-semibold text-[var(--heading)]">
                Manual Time Entry
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
            >
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Project selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
              Project
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl p-2" style={{ background: "var(--surface)" }}>
              {Array.from(grouped.entries()).map(([clientName, clientProjects]) => (
                <div key={clientName}>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 px-2 pt-1">
                    {clientName}
                  </p>
                  {clientProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                      style={{
                        background:
                          selectedProjectId === project.id
                            ? "var(--accent-muted)"
                            : "transparent",
                        border:
                          selectedProjectId === project.id
                            ? "1px solid var(--accent)"
                            : "1px solid transparent",
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background:
                            project.workspaces?.color || project.color || "var(--accent)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {project.workspaces?.name || "Personal"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              style={{ colorScheme: "dark" }}
            />
          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Duration Preview */}
          {durationPreview && (
            <div className="mb-4 px-3 py-2 rounded-xl text-sm" style={{
              background: durationPreview.includes("must be") ? "rgba(248, 113, 113, 0.1)" : "var(--accent-muted)",
              color: durationPreview.includes("must be") ? "var(--danger)" : "var(--accent)",
            }}>
              Duration: {durationPreview}
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
              Notes <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm mb-4" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProjectId || durationPreview.includes("must be")}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              <ClipboardPen size={16} />
              {loading ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
