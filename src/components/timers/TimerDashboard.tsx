"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Timer, Clock, Play, Pause, ClipboardPen } from "lucide-react";
import TimerCard from "./TimerCard";
import StartTimerModal from "./StartTimerModal";
import ManualEntryForm from "./ManualEntryForm";
import ProgressRing from "@/components/dashboard/ProgressRing";
import { startTimer } from "@/actions/time-entries";
import type { TimeEntryWithProject } from "@/actions/time-entries";
import type { ProjectWithClient } from "@/actions/projects";

function formatHours(totalSeconds: number): string {
  const hours = totalSeconds / 3600;
  return hours.toFixed(1);
}

function formatDurationCompact(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface TodaySummary {
  totalSeconds: number;
  totalHours: number;
  byProject: {
    projectId: string;
    projectName: string;
    projectColor: string;
    seconds: number;
    hours: number;
  }[];
}

interface PausedProject {
  projectId: string;
  projectName: string;
  projectColor: string;
  clientName: string | null;
  taskId: string | null;
}

export default function TimerDashboard({
  initialRunningTimers,
  initialSummary,
  projects,
}: {
  initialRunningTimers: TimeEntryWithProject[];
  initialSummary: TodaySummary;
  projects: ProjectWithClient[];
}) {
  const router = useRouter();
  const [runningTimers, setRunningTimers] = useState(initialRunningTimers);
  const [summary, setSummary] = useState(initialSummary);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [pausedProjects, setPausedProjects] = useState<PausedProject[]>([]);
  const [resumingProject, setResumingProject] = useState<string | null>(null);

  // Keep local state in sync when server props change (e.g., after router.refresh())
  useEffect(() => {
    setRunningTimers(initialRunningTimers);
    setSummary(initialSummary);
  }, [initialRunningTimers, initialSummary]);

  // Optimistic: remove timer from running list on stop
  const handleTimerStopped = useCallback((entryId: string) => {
    setRunningTimers((prev) => prev.filter((t) => t.id !== entryId));
    // Refresh server data in background
    router.refresh();
  }, [router]);

  // Optimistic: remove from running, add to paused section
  const handleTimerPaused = useCallback((entryId: string, projectId: string, taskId: string | null) => {
    const entry = runningTimers.find((t) => t.id === entryId);
    if (entry) {
      // Add to paused projects if not already there
      setPausedProjects((prev) => {
        if (prev.some((p) => p.projectId === projectId)) return prev;
        return [...prev, {
          projectId,
          projectName: entry.projects.name,
          projectColor: entry.projects.color,
          clientName: entry.projects.clients?.name ?? null,
          taskId,
        }];
      });
    }
    // Optimistic remove from running
    setRunningTimers((prev) => prev.filter((t) => t.id !== entryId));
    router.refresh();
  }, [runningTimers, router]);

  const handleTimerStarted = useCallback(() => {
    router.refresh();
  }, [router]);

  // Resume a paused project (quick resume from paused section)
  const handleQuickResume = useCallback(async (paused: PausedProject) => {
    setResumingProject(paused.projectId);
    // Optimistic: remove from paused list
    setPausedProjects((prev) => prev.filter((p) => p.projectId !== paused.projectId));
    const result = await startTimer(paused.projectId, paused.taskId);
    if (result.success) {
      router.refresh();
    } else {
      // Revert — put it back
      setPausedProjects((prev) => [...prev, paused]);
    }
    setResumingProject(null);
  }, [router]);

  // When a timer is resumed from within TimerCard (play button on paused card)
  const handleTimerResumed = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleManualEntryCreated = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleCloseStartModal = useCallback(() => {
    setShowStartModal(false);
  }, []);

  const handleCloseManualEntry = useCallback(() => {
    setShowManualEntry(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="trail-marker">Timers</p>
          <h1 className="text-2xl font-semibold text-[var(--heading)] mt-1">
            Time Tracking
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <ClipboardPen size={16} />
            <span className="hidden sm:inline">Manual Entry</span>
          </button>
          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Start Timer</span>
          </button>
        </div>
      </div>

      {/* Today's Summary — hero element with progress ring */}
      <div
        className="glass p-6"
        style={{ borderRadius: "1.25rem" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} style={{ color: "var(--accent)" }} />
          <p className="trail-marker" style={{ margin: 0 }}>
            Today&apos;s Summary
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Progress Ring */}
          <ProgressRing
            value={summary.totalSeconds}
            max={8 * 3600}
            size={100}
            strokeWidth={8}
            label="Hours"
            formatValue={(s) => formatHours(s)}
          />

          {/* Stats + breakdown */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-3">
              <span
                className="text-3xl font-bold tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                {formatHours(summary.totalSeconds)}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">hours today</span>
            </div>

            {summary.byProject.length > 0 ? (
              <div className="space-y-1.5">
                {summary.byProject.map((p) => (
                  <div key={p.projectId} className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: p.projectColor }}
                    />
                    <span className="text-sm text-[var(--text-primary)] flex-1 truncate">
                      {p.projectName}
                    </span>
                    <span className="text-sm tabular-nums text-[var(--text-secondary)]">
                      {formatDurationCompact(p.seconds)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No time tracked yet today.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Timers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Timer size={18} style={{ color: "var(--timer-active)" }} />
          <p className="trail-marker" style={{ margin: 0 }}>
            Active Timers
          </p>
          {runningTimers.length > 0 && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(217, 119, 6, 0.2)",
                color: "var(--timer-active)",
              }}
            >
              {runningTimers.length} running
            </span>
          )}
        </div>

        {runningTimers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {runningTimers.map((entry) => (
              <TimerCard
                key={entry.id}
                entry={entry}
                onStopped={handleTimerStopped}
                onPaused={handleTimerPaused}
                onResumed={handleTimerResumed}
              />
            ))}
          </div>
        ) : (
          <div
            className="glass p-8 text-center"
            style={{ borderRadius: "1.25rem" }}
          >
            <Timer
              size={40}
              className="mx-auto mb-3"
              style={{ color: "var(--text-muted)" }}
            />
            <p className="text-[var(--text-secondary)] mb-1">
              No active timers
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Start a timer to begin tracking time
            </p>
            <button
              onClick={() => setShowStartModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={16} />
              Quick Start
            </button>
          </div>
        )}
      </div>

      {/* Recently Paused — quick resume */}
      {pausedProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Pause size={18} style={{ color: "var(--text-muted)" }} />
            <p className="trail-marker" style={{ margin: 0 }}>
              Paused
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pausedProjects.map((paused) => (
              <div
                key={paused.projectId}
                className="glass flex items-center gap-3 p-4"
                style={{ borderRadius: "1rem" }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: paused.projectColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {paused.projectName}
                  </p>
                  {paused.clientName && (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {paused.clientName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleQuickResume(paused)}
                  disabled={resumingProject === paused.projectId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                  title="Resume timer"
                >
                  <Play size={14} />
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Timer Modal */}
      {showStartModal && (
        <StartTimerModal
          projects={projects}
          onClose={handleCloseStartModal}
          onStarted={handleTimerStarted}
        />
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualEntryForm
          projects={projects}
          onClose={handleCloseManualEntry}
          onCreated={handleManualEntryCreated}
        />
      )}
    </div>
  );
}
