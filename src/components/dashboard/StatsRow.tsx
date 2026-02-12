"use client";

import { FolderOpen, CalendarClock, AlertTriangle, Clock } from "lucide-react";
import ProgressRing from "./ProgressRing";

interface StatsRowProps {
  tasksDoneToday: number;
  totalTasksToday: number;
  activeProjects: number;
  dueToday: number;
  overdue: number;
  hoursToday: number;
}

const statCards = [
  { key: "projects", label: "Active Projects", icon: FolderOpen, color: "var(--accent)" },
  { key: "due", label: "Due Today", icon: CalendarClock, color: "var(--accent)" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "var(--danger)" },
  { key: "hours", label: "Hours Today", icon: Clock, color: "var(--timer-active)" },
] as const;

export default function StatsRow({
  tasksDoneToday,
  totalTasksToday,
  activeProjects,
  dueToday,
  overdue,
  hoursToday,
}: StatsRowProps) {
  const statValues: Record<string, string | number> = {
    projects: activeProjects,
    due: dueToday,
    overdue: overdue,
    hours: hoursToday.toFixed(1),
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5 items-stretch">
      {/* Progress Ring */}
      <div
        className="glass p-5 flex items-center justify-center flex-shrink-0 shadow-md"
        style={{ borderRadius: "1.25rem" }}
      >
        <ProgressRing
          value={tasksDoneToday}
          max={Math.max(totalTasksToday, 1)}
          size={100}
          strokeWidth={8}
          label="Done"
          formatValue={(v) => String(v)}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="glass p-4 flex flex-col gap-1 shadow-md"
            style={{ borderRadius: "1.25rem" }}
          >
            <div className="flex items-center gap-2">
              <Icon size={14} style={{ color }} />
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                {label}
              </span>
            </div>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: key === "overdue" && overdue > 0 ? "var(--danger)" : "var(--heading)" }}
            >
              {statValues[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
