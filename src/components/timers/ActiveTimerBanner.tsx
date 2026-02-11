"use client";

import { useState, useEffect, useCallback } from "react";
import { Timer } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

interface RunningTimer {
  id: string;
  start_time: string;
  project_id: string;
  projects: {
    name: string;
    color: string;
  };
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ActiveTimerBanner() {
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  // Fetch running timers from Supabase on mount
  const fetchTimers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("time_entries")
        .select("id, start_time, project_id, projects(name, color)")
        .eq("is_running", true)
        .order("start_time", { ascending: false });

      if (data) {
        setTimers(data as unknown as RunningTimer[]);
      }
    } catch {
      // Silently fail — banner is informational, not critical
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTimers();

    // Re-fetch every 30 seconds to pick up timers started/stopped elsewhere
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

  // Don't render anything until loaded, and don't render if no running timers
  if (!loaded || timers.length === 0) return null;

  return (
    <Link
      href="/timers"
      className="block mx-4 md:mx-7 mb-2"
    >
      <div
        className="glass flex items-center gap-3 px-4 py-2.5 animate-timer-pulse"
        style={{ borderRadius: "0.75rem" }}
      >
        <Timer
          size={16}
          className="flex-shrink-0"
          style={{ color: "var(--timer-active)" }}
        />
        <div className="flex items-center gap-3 overflow-x-auto flex-1 min-w-0">
          {timers.map((timer) => (
            <div
              key={timer.id}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: timer.projects.color || "var(--accent)" }}
              />
              <span className="text-xs text-[var(--text-secondary)] truncate max-w-[120px]">
                {timer.projects.name}
              </span>
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: "var(--timer-active)" }}
              >
                {formatDuration(elapsed[timer.id] ?? 0)}
              </span>
            </div>
          ))}
        </div>
        <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
          {timers.length} active
        </span>
      </div>
    </Link>
  );
}
