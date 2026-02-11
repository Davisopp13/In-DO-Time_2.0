"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, CheckSquare, Clock, FileText } from "lucide-react";
import type { Client, Workspace } from "@/types";
import type { ProjectWithClient } from "@/actions/projects";
import ProjectFormModal from "./ProjectFormModal";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

type Tab = "tasks" | "time" | "notes";

interface ProjectDetailProps {
  project: ProjectWithClient;
  workspaces: Workspace[];
  clients: Client[];
}

export default function ProjectDetail({ project: initialProject, workspaces, clients }: ProjectDetailProps) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [modalOpen, setModalOpen] = useState(false);

  const workspaceColor = project.workspaces?.color ?? project.color ?? "#84cc16";
  const workspaceName = project.workspaces?.name ?? "Personal";
  const statusLabel = STATUS_LABELS[project.status] ?? project.status;

  const handleSaved = useCallback(() => {
    window.location.reload();
  }, []);

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: "tasks", label: "Tasks", icon: <CheckSquare size={16} /> },
    { value: "time", label: "Time Entries", icon: <Clock size={16} /> },
    { value: "notes", label: "Notes", icon: <FileText size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Projects
      </Link>

      {/* Project header */}
      <div className="glass p-6" style={{ borderRadius: "1.25rem" }}>
        {/* Color stripe */}
        <div
          className="h-1 -mt-6 -mx-6 mb-5 rounded-t-[1.25rem]"
          style={{ backgroundColor: workspaceColor }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--heading)]">
              {project.name}
            </h1>
            {project.clients && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {project.clients.name}
              </p>
            )}
            {project.description && (
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {project.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${workspaceColor}20`,
                  color: workspaceColor,
                }}
              >
                {workspaceName}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${project.status === "active"
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : project.status === "paused"
                    ? "bg-yellow-500/15 text-yellow-500"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                  }`}
              >
                {statusLabel}
              </span>
              {project.hourly_rate_override != null && (
                <span className="text-xs text-[var(--text-muted)]">
                  ${project.hourly_rate_override}/hr
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] flex-shrink-0"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 glass" style={{ borderRadius: "1rem" }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${activeTab === tab.value
              ? "bg-[var(--accent-muted)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass p-6" style={{ borderRadius: "1.25rem" }}>
        {activeTab === "tasks" && (
          <div className="text-center py-8">
            <CheckSquare size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-sm">
              Task management for this project coming soon.
            </p>
          </div>
        )}
        {activeTab === "time" && (
          <div className="text-center py-8">
            <Clock size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-sm">
              Time entries for this project coming soon.
            </p>
          </div>
        )}
        {activeTab === "notes" && (
          <div className="text-center py-8">
            <FileText size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] text-sm">
              Notes for this project coming soon.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ProjectFormModal
        project={project}
        workspaces={workspaces}
        clients={clients}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
