"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import type { TimeEntryWithProject } from "@/actions/time-entries";

interface TimeTableProps {
  entries: TimeEntryWithProject[];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getHourlyRate(entry: TimeEntryWithProject): number {
  return entry.projects.hourly_rate_override ?? entry.projects.clients?.hourly_rate ?? 70;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

interface DayGroup {
  dateKey: string;
  label: string;
  entries: TimeEntryWithProject[];
  totalSeconds: number;
  totalAmount: number;
}

export default function TimeTable({ entries }: TimeTableProps) {
  // Group entries by date
  const dayGroups = useMemo(() => {
    const groups = new Map<string, TimeEntryWithProject[]>();

    for (const entry of entries) {
      const dateKey = new Date(entry.start_time).toLocaleDateString("en-CA"); // YYYY-MM-DD format
      const existing = groups.get(dateKey) ?? [];
      existing.push(entry);
      groups.set(dateKey, existing);
    }

    // Sort by date descending (most recent first)
    const sorted: DayGroup[] = Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, dayEntries]) => {
        const totalSeconds = dayEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
        const totalAmount = dayEntries.reduce((sum, e) => {
          const hours = (e.duration_seconds ?? 0) / 3600;
          return sum + hours * getHourlyRate(e);
        }, 0);
        return {
          dateKey,
          label: formatDateHeader(dateKey),
          entries: dayEntries,
          totalSeconds,
          totalAmount,
        };
      });

    return sorted;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="glass p-12 text-center" style={{ borderRadius: "1.25rem" }}>
        <Clock size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
        <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
          No time entries found
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Try adjusting the date range or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {dayGroups.map((group) => (
        <div key={group.dateKey}>
          {/* Trail Marker date header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <p
              className="text-xs font-semibold uppercase"
              style={{
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
              }}
            >
              ▲ {group.label}
            </p>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {formatDuration(group.totalSeconds)}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--accent)" }}
              >
                ${group.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Day's entries table */}
          <div className="glass overflow-hidden" style={{ borderRadius: "1.25rem" }}>
            {/* Table header — hidden on mobile */}
            <div
              className="hidden sm:grid px-5 py-2.5 text-xs font-semibold uppercase"
              style={{
                gridTemplateColumns: "1fr 1fr 100px 80px 90px minmax(0, 1fr)",
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span>Project</span>
              <span>Client</span>
              <span>Duration</span>
              <span>Rate</span>
              <span>Amount</span>
              <span>Notes</span>
            </div>

            {/* Entries */}
            {group.entries.map((entry, idx) => {
              const rate = getHourlyRate(entry);
              const hours = (entry.duration_seconds ?? 0) / 3600;
              const amount = hours * rate;
              const isOdd = idx % 2 === 1;

              return (
                <div
                  key={entry.id}
                  className="sm:grid px-5 py-3"
                  style={{
                    gridTemplateColumns: "1fr 1fr 100px 80px 90px minmax(0, 1fr)",
                    background: isOdd ? "rgba(255,255,255,0.03)" : "transparent",
                    borderBottom: idx < group.entries.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  {/* Project (with color dot and time range) */}
                  <div className="flex items-center gap-2 min-w-0 mb-1 sm:mb-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: entry.projects.color }}
                    />
                    <div className="min-w-0">
                      <span
                        className="text-sm font-medium block truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {entry.projects.name}
                      </span>
                      <span
                        className="text-xs block sm:hidden"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatTime(entry.start_time)}
                        {entry.end_time ? ` – ${formatTime(entry.end_time)}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="flex items-center min-w-0 mb-1 sm:mb-0">
                    <span
                      className="text-sm truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {entry.projects.clients?.name ?? "—"}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatDuration(entry.duration_seconds ?? 0)}
                    </span>
                  </div>

                  {/* Rate */}
                  <div className="flex items-center">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      ${rate}/hr
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center">
                    <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      ${amount.toFixed(2)}
                    </span>
                  </div>

                  {/* Notes */}
                  <div className="flex items-center min-w-0">
                    <span
                      className="text-sm truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {entry.notes || "—"}
                    </span>
                  </div>

                  {/* Mobile-only compact layout for remaining fields */}
                  <div
                    className="flex items-center gap-4 mt-1 sm:hidden"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {entry.projects.clients?.name ?? "No client"}
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatDuration(entry.duration_seconds ?? 0)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      ${rate}/hr
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      ${amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
