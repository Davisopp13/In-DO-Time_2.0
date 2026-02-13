"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export type DatePreset = "this_week" | "last_week" | "this_month" | "last_month" | "custom";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom" },
];

function getPresetDates(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "this_week": {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7)); // Monday
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: fmt(monday), end: fmt(sunday) };
    }
    case "last_week": {
      const day = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - ((day + 6) % 7));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { start: fmt(lastMonday), end: fmt(lastSunday) };
    }
    case "this_month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: fmt(firstDay), end: fmt(lastDay) };
    }
    case "last_month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: fmt(firstDay), end: fmt(lastDay) };
    }
    default:
      return { start: fmt(today), end: fmt(today) };
  }
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<DatePreset>("this_week");
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePresetClick = (p: DatePreset) => {
    setPreset(p);
    setShowDropdown(false);
    if (p !== "custom") {
      const { start, end } = getPresetDates(p);
      onRangeChange(start, end);
    }
  };

  const currentLabel = PRESETS.find((p) => p.value === preset)?.label ?? "This Week";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Preset dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium min-h-[44px]"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <Calendar size={16} style={{ color: "var(--accent)" }} />
          {currentLabel}
          <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden min-w-[160px]"
              style={{
                background: "var(--surface)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid var(--border)",
              }}
            >
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePresetClick(p.value)}
                  className="w-full text-left px-4 py-2.5 text-sm min-h-[44px]"
                  style={{
                    color: preset === p.value ? "var(--accent)" : "var(--text-primary)",
                    background: preset === p.value ? "var(--accent-muted)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (preset !== p.value) e.currentTarget.style.background = "var(--surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = preset === p.value ? "var(--accent-muted)" : "transparent";
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Date inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setPreset("custom");
            onRangeChange(e.target.value, endDate);
          }}
          className="px-3 py-2 rounded-xl text-sm min-h-[44px]"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            colorScheme: "dark",
          }}
        />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setPreset("custom");
            onRangeChange(startDate, e.target.value);
          }}
          className="px-3 py-2 rounded-xl text-sm min-h-[44px]"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            colorScheme: "dark",
          }}
        />
      </div>
    </div>
  );
}
