"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import type { ProjectWithClient } from "@/actions/projects";
import type { TaskWithProject } from "@/actions/tasks";

interface DashboardProjectsProps {
  projects: ProjectWithClient[];
  tasks: TaskWithProject[];
}

export default React.memo(function DashboardProjects({ projects, tasks }: DashboardProjectsProps) {
  // Compute task counts per project (memoized)
  const taskCountsByProject = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (!t.project_id) continue;
      if (!counts[t.project_id]) {
        counts[t.project_id] = { total: 0, done: 0 };
      }
      counts[t.project_id].total++;
      if (t.status === "done") counts[t.project_id].done++;
    }
    return counts;
  }, [tasks]);

  return (
    <div
      className="glass p-5 flex flex-col h-full"
      style={{ borderRadius: "1.25rem" }}
    >
      {/* Trail Marker Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="trail-marker text-xs">▲ Active Projects</h2>
        <Link
          href="/projects"
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          All Projects →
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">No active projects.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
          {projects.map((project) => {
            const workspaceColor = project.workspaces?.color ?? project.color ?? "#84cc16";
            const workspaceName = project.workspaces?.name ?? "Personal";
            const counts = taskCountsByProject[project.id];
            const openCount = counts ? counts.total - counts.done : 0;
            const progressPercent = counts && counts.total > 0
              ? Math.round((counts.done / counts.total) * 100)
              : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group"
              >
                {/* Workspace color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: workspaceColor }}
                />

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {project.name}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0 rounded-full font-medium flex-shrink-0"
                      style={{
                        backgroundColor: `${workspaceColor}20`,
                        color: workspaceColor,
                      }}
                    >
                      {workspaceName}
                    </span>
                  </div>
                  {project.clients && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {project.clients.name}
                    </span>
                  )}
                </div>

                {/* Task progress */}
                {counts && counts.total > 0 ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: workspaceColor
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums w-8 text-right">
                      {openCount > 0 ? `${openCount} open` : "Done"}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                    No tasks
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});
