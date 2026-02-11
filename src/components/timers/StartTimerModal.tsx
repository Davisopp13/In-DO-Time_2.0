"use client";

import { useState } from "react";
import { X, Play, Clock } from "lucide-react";
import { startTimer } from "@/actions/time-entries";
import type { ProjectWithClient } from "@/actions/projects";

export default function StartTimerModal({
  projects,
  onClose,
  onStarted,
}: {
  projects: ProjectWithClient[];
  onClose: () => void;
  onStarted: () => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Group projects by client
  const grouped = new Map<string, ProjectWithClient[]>();
  for (const project of projects) {
    const key = project.clients?.name || "No Client";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(project);
  }

  async function handleStart() {
    if (!selectedProjectId) {
      setError("Please select a project");
      return;
    }

    setLoading(true);
    setError("");
    const result = await startTimer(selectedProjectId);
    if (result.success) {
      onStarted();
      onClose();
    } else {
      setError(result.error || "Failed to start timer");
    }
    setLoading(false);
  }

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
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={20} style={{ color: "var(--accent)" }} />
              <h2 className="text-lg font-semibold text-[var(--heading)]">
                Start Timer
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)]"
            >
              <X size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Project selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Select Project
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Array.from(grouped.entries()).map(([clientName, clientProjects]) => (
                <div key={clientName}>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1 px-1">
                    {clientName}
                  </p>
                  {clientProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
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
                        className="w-3 h-3 rounded-full flex-shrink-0"
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

          {error && (
            <p className="text-sm mt-3" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={loading || !selectedProjectId}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              <Play size={16} />
              Start Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
