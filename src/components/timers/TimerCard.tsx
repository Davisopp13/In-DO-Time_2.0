"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, Square, DollarSign } from "lucide-react";
import { stopTimer, pauseTimer, resumeTimer } from "@/actions/time-entries";
import type { TimeEntryWithProject } from "@/actions/time-entries";

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getHourlyRate(entry: TimeEntryWithProject): number {
  return entry.projects.hourly_rate_override ?? entry.projects.clients?.hourly_rate ?? 70;
}

function calculateCost(totalSeconds: number, hourlyRate: number): string {
  const hours = totalSeconds / 3600;
  return (hours * hourlyRate).toFixed(2);
}

type TimerState = "running" | "paused" | "stopped";

export default function TimerCard({
  entry,
  onStopped,
  onPaused,
  onResumed,
}: {
  entry: TimeEntryWithProject;
  onStopped: (entryId: string) => void;
  onPaused?: (entryId: string, projectId: string, taskId: string | null) => void;
  onResumed?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("running");
  const [loading, setLoading] = useState(false);

  // Calculate initial elapsed from start_time (prevents drift)
  const calcElapsed = useCallback(() => {
    return Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
  }, [entry.start_time]);

  useEffect(() => {
    if (timerState !== "running") return;
    setElapsed(calcElapsed());
    const interval = setInterval(() => {
      setElapsed(calcElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [calcElapsed, timerState]);

  const hourlyRate = getHourlyRate(entry);
  const cost = calculateCost(elapsed, hourlyRate);
  const clientName = entry.projects.clients?.name;
  const projectColor = entry.projects.color || "var(--accent)";

  async function handleStop() {
    setLoading(true);
    // Optimistic: freeze the timer immediately
    setTimerState("stopped");
    const result = await stopTimer(entry.id);
    if (result.success) {
      onStopped(entry.id);
    } else {
      // Revert on failure
      setTimerState("running");
    }
    setLoading(false);
  }

  async function handlePause() {
    setLoading(true);
    // Optimistic: freeze the timer display immediately
    setTimerState("paused");
    const result = await pauseTimer(entry.id);
    if (result.success) {
      onPaused?.(entry.id, result.projectId!, result.taskId ?? null);
    } else {
      // Revert on failure
      setTimerState("running");
    }
    setLoading(false);
  }

  async function handleResume() {
    setLoading(true);
    const result = await resumeTimer(entry.project_id, entry.task_id);
    if (result.success) {
      onResumed?.();
    }
    setLoading(false);
  }

  const isRunning = timerState === "running";
  const isPaused = timerState === "paused";

  return (
    <div
      className={`glass relative overflow-hidden ${isRunning ? "animate-timer-pulse" : ""}`}
      style={{
        borderRadius: "1.25rem",
        opacity: timerState === "stopped" ? 0.5 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      {/* Color accent stripe */}
      <div
        className="h-1 w-full"
        style={{ background: projectColor }}
      />

      <div className="p-5">
        {/* Project & client info */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-[var(--heading)] leading-tight">
            {entry.projects.name}
          </h3>
          {clientName && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {clientName}
            </p>
          )}
        </div>

        {/* Timer display */}
        <div className="text-center my-4">
          <p
            className="text-4xl font-bold tabular-nums tracking-wide"
            style={{ color: isPaused ? "var(--text-muted)" : "var(--timer-active)" }}
          >
            {formatDuration(elapsed)}
          </p>
          {isPaused && (
            <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: "var(--text-muted)" }}>
              Paused
            </p>
          )}
          <div className="flex items-center justify-center gap-1 mt-2 text-sm text-[var(--text-secondary)]">
            <DollarSign size={14} />
            <span className="tabular-nums">${cost}</span>
            <span className="text-[var(--text-muted)] ml-1">
              @ ${hourlyRate}/hr
            </span>
          </div>
        </div>

        {/* Controls: Play / Pause / Stop */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {isPaused ? (
            <button
              onClick={handleResume}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
              title="Resume timer"
            >
              <Play size={16} />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={loading || !isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--surface-hover)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              title="Pause timer"
            >
              <Pause size={16} />
              <span>Pause</span>
            </button>
          )}
          <button
            onClick={handleStop}
            disabled={loading || timerState === "stopped"}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50"
            style={{
              background: "var(--danger)",
              color: "#fff",
            }}
            title="Stop timer"
          >
            <Square size={16} />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
