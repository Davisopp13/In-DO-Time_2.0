"use client";

import { useState, useCallback, useEffect } from "react";
import { Clock, DollarSign, TrendingUp, Download } from "lucide-react";
import type { TimeEntryWithProject } from "@/actions/time-entries";
import { getTimeEntries } from "@/actions/time-entries";
import type { ProjectWithClient } from "@/actions/projects";
import type { Client } from "@/types";
import DateRangePicker from "./DateRangePicker";
import TimeTable from "./TimeTable";

interface ReportsViewProps {
  initialEntries: TimeEntryWithProject[];
  projects: ProjectWithClient[];
  clients: Client[];
  initialStartDate: string;
  initialEndDate: string;
}

function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(2);
}

function getHourlyRate(entry: TimeEntryWithProject): number {
  return entry.projects.hourly_rate_override ?? entry.projects.clients?.hourly_rate ?? 70;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCSVDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US");
}

function formatCSVTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function generateCSV(entries: TimeEntryWithProject[], startDate: string, endDate: string): void {
  const headers = ["Date", "Client", "Project", "Start Time", "End Time", "Duration (hours)", "Rate", "Amount", "Notes"];
  const rows = entries.map((entry) => {
    const rate = getHourlyRate(entry);
    const hours = (entry.duration_seconds ?? 0) / 3600;
    const amount = hours * rate;
    return [
      formatCSVDate(entry.start_time),
      escapeCSV(entry.projects.clients?.name ?? ""),
      escapeCSV(entry.projects.name),
      formatCSVTime(entry.start_time),
      entry.end_time ? formatCSVTime(entry.end_time) : "",
      hours.toFixed(2),
      rate.toFixed(2),
      amount.toFixed(2),
      escapeCSV(entry.notes ?? ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `in-do-time-report-${startDate}-to-${endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsView({
  initialEntries,
  projects,
  clients,
  initialStartDate,
  initialEndDate,
}: ReportsViewProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      // Fetch entries for the date range — endDate needs to be end of day
      const endOfDay = new Date(end);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const data = await getTimeEntries({
        startDate: new Date(start).toISOString(),
        endDate: endOfDay.toISOString(),
      });
      setEntries(data);
    } catch {
      // Keep existing entries on error
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRangeChange = useCallback(
    (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
      fetchEntries(start, end);
    },
    [fetchEntries]
  );

  // Filter entries by client and project
  const filteredEntries = entries.filter((entry) => {
    if (projectFilter !== "all" && entry.project_id !== projectFilter) return false;
    if (clientFilter !== "all") {
      const clientId = entry.projects.clients?.id;
      if (clientId !== clientFilter) return false;
    }
    return true;
  });

  // Exclude running timers from reports (they have no end_time/duration)
  const completedEntries = filteredEntries.filter((e) => !e.is_running);

  // Summary calculations
  const totalSeconds = completedEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
  const totalBillable = completedEntries.reduce((sum, e) => {
    const hours = (e.duration_seconds ?? 0) / 3600;
    return sum + hours * getHourlyRate(e);
  }, 0);

  // Calculate number of unique days in the range
  const uniqueDays = new Set(
    completedEntries.map((e) => new Date(e.start_time).toLocaleDateString())
  );
  const avgSecondsPerDay = uniqueDays.size > 0 ? totalSeconds / uniqueDays.size : 0;

  // Filter projects by selected client for cascading filter
  const filteredProjects =
    clientFilter === "all"
      ? projects
      : projects.filter((p) => p.client_id === clientFilter);

  // Reset project filter when client changes if current selection is no longer valid
  useEffect(() => {
    if (clientFilter !== "all" && projectFilter !== "all") {
      const valid = filteredProjects.some((p) => p.id === projectFilter);
      if (!valid) setProjectFilter("all");
    }
  }, [clientFilter, projectFilter, filteredProjects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="trail-marker">Reports</p>
          <h1 className="text-2xl font-semibold mt-1" style={{ color: "var(--heading)" }}>
            Time Reports
          </h1>
        </div>
        <button
          onClick={() => generateCSV(completedEntries, startDate, endDate)}
          disabled={completedEntries.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: completedEntries.length > 0 ? "var(--accent)" : "var(--surface)",
            color: completedEntries.length > 0 ? "#000" : "var(--text-muted)",
          }}
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onRangeChange={handleRangeChange}
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Client filter */}
        <div className="relative">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium cursor-pointer"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project filter */}
        <div className="relative">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium cursor-pointer"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="all">All Projects</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.clients ? ` (${p.clients.name})` : ""}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading...
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5" style={{ borderRadius: "1.25rem" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "var(--accent-muted)" }}
            >
              <Clock size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Total Hours
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--heading)" }}>
                {formatHours(totalSeconds)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-5" style={{ borderRadius: "1.25rem" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "var(--accent-muted)" }}
            >
              <DollarSign size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Total Billable
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--heading)" }}>
                ${totalBillable.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass p-5" style={{ borderRadius: "1.25rem" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "var(--accent-muted)" }}
            >
              <TrendingUp size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Avg Hours/Day
              </p>
              <p className="text-2xl font-bold" style={{ color: "var(--heading)" }}>
                {formatHours(avgSecondsPerDay)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Entries count */}
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {completedEntries.length} time {completedEntries.length === 1 ? "entry" : "entries"} in selected range
      </p>

      {/* Time Entry Table with trail marker date headers and zebra striping */}
      <TimeTable entries={completedEntries} />
    </div>
  );
}
