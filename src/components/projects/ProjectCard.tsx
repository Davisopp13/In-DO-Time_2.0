"use client";

import Link from "next/link";
import { Pencil, Archive, ArchiveRestore, Pause, Ship, Code, User, Bot } from "lucide-react";
import type { ProjectWithClient } from "@/actions/projects";

const iconMap: Record<string, any> = {
  Ship,
  Code,
  User,
  Bot,
};

interface ProjectCardProps {
  project: ProjectWithClient;
  taskCounts?: { total: number; done: number };
  onEdit: (project: ProjectWithClient) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}

export default function ProjectCard({ project, taskCounts, onEdit, onArchive, onRestore }: ProjectCardProps) {
  const isCompleted = project.status === "completed";
  const isPaused = project.status === "paused";
  const workspaceColor = project.workspaces?.color ?? "#84cc16";
  const workspaceName = project.workspaces?.name ?? "Personal";
  const WorkspaceIcon = iconMap[project.workspaces?.icon || "User"] || User;

  const progressPercent = taskCounts && taskCounts.total > 0
    ? Math.round((taskCounts.done / taskCounts.total) * 100)
    : 0;

  return (
    <div
      className={`glass group relative overflow-hidden flex flex-col h-full transition-all duration-300 hover:translate-y-[-2px] ${isCompleted ? "opacity-60" : ""}`}
      style={{
        borderRadius: "1.25rem",
        borderColor: `${workspaceColor}30`
      }}
    >
      {/* Background Glow */}
      <div
        className="absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-20 rounded-full"
        style={{ backgroundColor: workspaceColor }}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Top row: Workspace Icon + name + actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <Link href={`/projects/${project.id}`} className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: workspaceColor }}
            >
              <WorkspaceIcon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[var(--heading)] truncate group-hover:text-[var(--accent)] transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60" style={{ color: workspaceColor }}>
                  {workspaceName}
                </span>
                {project.clients && (
                  <>
                    <span className="text-[10px] text-[var(--text-muted)]">•</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      {project.clients.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(project); }}
              className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            {isCompleted ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRestore(project.id); }}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all"
                title="Restore"
              >
                <ArchiveRestore size={14} />
              </button>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchive(project.id); }}
                className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-all"
                title="Archive"
              >
                <Archive size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-[var(--text-secondary)] mb-6 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="mt-auto space-y-4">
          {/* Progress bar */}
          {taskCounts && taskCounts.total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)] font-medium">Task Completion</span>
                <span className="text-[var(--text-primary)] font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: workspaceColor,
                    boxShadow: `0 0 10px ${workspaceColor}40`
                  }}
                />
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {isPaused && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] font-semibold">
                Paused
              </span>
            )}

            {taskCounts && taskCounts.total > 0 && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] font-semibold">
                {taskCounts.total - taskCounts.done} tasks open
              </span>
            )}

            {!taskCounts && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] font-semibold italic">
                No tasks yet
              </span>
            )}

            <Link
              href={`/projects/${project.id}`}
              className="ml-auto text-xs font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
            >
              View Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
