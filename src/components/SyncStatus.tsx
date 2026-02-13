"use client";

import React from "react";
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from "lucide-react";
import type { SyncStatus as SyncStatusType } from "@/hooks/useSync";

interface SyncStatusProps {
  status: SyncStatusType;
  lastSyncedAt: Date | null;
  onManualSync?: () => void;
  pendingCount?: number;
}

const statusConfig: Record<
  SyncStatusType,
  { icon: typeof Cloud; label: string; className: string }
> = {
  synced: {
    icon: Cloud,
    label: "Synced",
    className: "text-green-400",
  },
  syncing: {
    icon: RefreshCw,
    label: "Syncing...",
    className: "text-[var(--accent)] animate-spin",
  },
  offline: {
    icon: CloudOff,
    label: "Offline",
    className: "text-[var(--text-muted)]",
  },
  error: {
    icon: AlertTriangle,
    label: "Sync error",
    className: "text-[var(--danger)]",
  },
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default React.memo(function SyncStatus({
  status,
  lastSyncedAt,
  onManualSync,
  pendingCount = 0,
}: SyncStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <button
      onClick={onManualSync}
      disabled={status === "syncing"}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-medium transition-all hover:bg-[var(--surface-hover)] min-h-[44px]"
      title={
        lastSyncedAt
          ? `Last synced ${formatTimeAgo(lastSyncedAt)}`
          : config.label
      }
      aria-label={config.label}
    >
      <Icon size={14} className={config.className} />
      <span className="hidden sm:inline text-[var(--text-muted)]">
        {status === "syncing"
          ? "Syncing"
          : lastSyncedAt
            ? formatTimeAgo(lastSyncedAt)
            : config.label}
      </span>

      {/* Offline pending count badge */}
      {status === "offline" && pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--danger)] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </button>
  );
});
