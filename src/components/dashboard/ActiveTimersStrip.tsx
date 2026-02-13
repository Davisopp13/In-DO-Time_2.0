"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer, Play, Square, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { stopTimer } from "@/actions/time-entries";
import { useRouter } from "next/navigation";

interface RunningTimer {
  id: string;
  start_time: string;
  project_id: string;
  projects: {
    name: string;
    color: string;
    hourly_rate_override: number | null;
    clients: {
      name: string;
      hourly_rate: number;
    } | null;
  };
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getHourlyRate(timer: RunningTimer): number {
  return timer.projects.hourly_rate_override ?? timer.projects.clients?.hourly_rate ?? 70;
}

function calculateCost(totalSeconds: number, hourlyRate: number): string {
  const hours = totalSeconds / 3600;
  return (hours * hourlyRate).toFixed(2);
}

export default function ActiveTimersStrip() {
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [stopping, setStopping] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const fetchTimers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("time_entries")
        .select("id, start_time, project_id, projects(name, color, hourly_rate_override, clients(name, hourly_rate))")
        .eq("is_running", true)
        .order("start_time", { ascending: false });

      if (data) {
        setTimers(data as unknown as RunningTimer[]);
      }
    } catch {
      // Silently fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTimers();
    const pollInterval = setInterval(fetchTimers, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchTimers]);

  // Tick elapsed times every second
  useEffect(() => {
    if (timers.length === 0) return;

    function tick() {
      const now = Date.now();
      const newElapsed: Record<string, number> = {};
      for (const timer of timers) {
        newElapsed[timer.id] = Math.floor(
          (now - new Date(timer.start_time).getTime()) / 1000
        );
      }
      setElapsed(newElapsed);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  const handleStop = useCallback(async (timerId: string) => {
    setStopping((prev) => ({ ...prev, [timerId]: true }));
    // Optimistic remove
    setTimers((prev) => prev.filter((t) => t.id !== timerId));
    const result = await stopTimer(timerId);
    if (!result.success) {
      // Revert — re-fetch
      fetchTimers();
    } else {
      router.refresh();
    }
    setStopping((prev) => ({ ...prev, [timerId]: false }));
  }, [fetchTimers, router]);

  if (!loaded) return null;

  // Empty state
  if (timers.length === 0) {
    return (
      <div
        className="glass p-5"
        style={{ borderRadius: "1.25rem" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Timer size={16} style={{ color: "var(--timer-active)" }} />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
            ▲ Active Timers
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            No active timers
          </p>
          <Link
            href="/timers"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <Plus size={16} />
            <span>Start Timer</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass p-5"
      style={{ borderRadius: "1.25rem" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer size={16} style={{ color: "var(--timer-active)" }} />
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
          ▲ Active Timers
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: "var(--timer-active)", backgroundColor: "rgba(217, 119, 6, 0.15)" }}>
          {timers.length} running
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {timers.map((timer) => {
          const elapsedSec = elapsed[timer.id] ?? 0;
          const rate = getHourlyRate(timer);
          const cost = calculateCost(elapsedSec, rate);
          const clientName = timer.projects.clients?.name;

          return (
            <div
              key={timer.id}
              className="glass flex-shrink-0 relative overflow-hidden animate-timer-pulse"
              style={{ borderRadius: "1rem", minWidth: "200px" }}
            >
              {/* Color accent stripe */}
              <div
                className="h-1 w-full"
                style={{ background: timer.projects.color || "var(--accent)" }}
              />

              <div className="p-4">
                <div className="mb-2">
                  <h4 className="text-sm font-semibold text-[var(--heading)] truncate">
                    {timer.projects.name}
                  </h4>
                  {clientName && (
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {clientName}
                    </p>
                  )}
                </div>

                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: "var(--timer-active)" }}
                >
                  {formatDuration(elapsedSec)}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                  ${cost}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleStop(timer.id)}
                    disabled={stopping[timer.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50"
                    style={{ background: "var(--danger)", color: "#fff" }}
                    title="Stop timer"
                  >
                    <Square size={12} />
                    Stop
                  </button>
                  <Link
                    href="/timers"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: "var(--surface-hover)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Play size={12} />
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
