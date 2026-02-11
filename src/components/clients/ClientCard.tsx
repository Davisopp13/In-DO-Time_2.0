"use client";

import { Pencil, Archive, ArchiveRestore, Mail, DollarSign } from "lucide-react";
import type { Client } from "@/types";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export default function ClientCard({ client, onEdit, onArchive, onRestore }: ClientCardProps) {
  const isArchived = client.status === "archived";

  return (
    <div
      className={`glass p-4 ${isArchived ? "opacity-60" : ""}`}
      style={{ borderRadius: "1.25rem" }}
    >
      {/* Color accent + name */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: client.color }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--heading)] truncate">
              {client.name}
            </h3>
            {client.email && (
              <div className="flex items-center gap-1 mt-0.5">
                <Mail size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                <span className="text-xs text-[var(--text-muted)] truncate">{client.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(client)}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          {isArchived ? (
            <button
              onClick={() => onRestore(client.id)}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--accent)]"
              title="Restore"
            >
              <ArchiveRestore size={14} />
            </button>
          ) : (
            <button
              onClick={() => onArchive(client.id)}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--danger)]"
              title="Archive"
            >
              <Archive size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Rate + status */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
          <DollarSign size={12} />
          <span>{client.hourly_rate}/hr</span>
        </div>
        {isArchived && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
            Archived
          </span>
        )}
      </div>

      {/* Notes preview */}
      {client.notes && (
        <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">
          {client.notes}
        </p>
      )}
    </div>
  );
}
