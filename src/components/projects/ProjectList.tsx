"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, FolderOpen } from "lucide-react";
import type { Client, Workspace } from "@/types";
import { useWorkspace } from "@/lib/workspace";
import type { ProjectWithClient } from "@/actions/projects";
import { archiveProject, restoreProject } from "@/actions/projects";
import ProjectCard from "./ProjectCard";
import ProjectFormModal from "./ProjectFormModal";

interface ProjectListProps {
  initialProjects: ProjectWithClient[];
  clients: Client[];
  workspaces: Workspace[];
}

export default function ProjectList({ initialProjects, clients, workspaces }: ProjectListProps) {
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState(initialProjects);
  const [showCompleted, setShowCompleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithClient | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesWorkspace = !currentWorkspace || p.workspace_id === currentWorkspace.id;
      const matchesStatus = showCompleted || p.status !== "completed";
      return matchesWorkspace && matchesStatus;
    });
  }, [projects, currentWorkspace, showCompleted]);

  const activeCount = useMemo(() =>
    projects.filter(p => (!currentWorkspace || p.workspace_id === currentWorkspace.id) && p.status !== "completed").length
    , [projects, currentWorkspace]);

  const completedCount = useMemo(() =>
    projects.filter(p => (!currentWorkspace || p.workspace_id === currentWorkspace.id) && p.status === "completed").length
    , [projects, currentWorkspace]);

  const handleEdit = useCallback((project: ProjectWithClient) => {
    setEditingProject(project);
    setModalOpen(true);
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    const result = await archiveProject(id);
    if (result.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "completed" as const } : p))
      );
    }
  }, []);

  const handleRestore = useCallback(async (id: string) => {
    const result = await restoreProject(id);
    if (result.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "active" as const } : p))
      );
    }
  }, []);

  const handleSaved = useCallback(() => {
    window.location.reload();
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingProject(null);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="trail-marker">Workspace Projects</p>
          <h1 className="text-3xl font-bold text-[var(--heading)] mt-1">
            {currentWorkspace?.name ?? "All Projects"}
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent-glow)] group"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90" />
          New Project
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="glass px-4 py-2 border-[var(--workspace-color-muted)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Active</p>
          <p className="text-xl font-bold text-[var(--workspace-color)]">{activeCount}</p>
        </div>
        <div className="glass px-4 py-2 border-[var(--border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Completed</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">{completedCount}</p>
        </div>
      </div>

      {/* Show completed toggle */}
      {completedCount > 0 && (
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full glass text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <div className={`w-2 h-2 rounded-full ${showCompleted ? "bg-[var(--accent)]" : "bg-gray-500"}`} />
          {showCompleted ? "Hide completed projects" : `Show ${completedCount} completed projects`}
        </button>
      )}

      {/* Project grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass p-12 text-center border-dashed border-2 border-[var(--border)]">
          <FolderOpen size={48} className="text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No Projects Found</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto">
            {currentWorkspace
              ? `You haven't created any projects in the ${currentWorkspace.name} workspace yet.`
              : "No projects found. Create your first project to get started."}
          </p>
          <button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="mt-6 text-[var(--accent)] text-sm font-semibold hover:underline"
          >
            Create your first project →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ProjectFormModal
        project={editingProject}
        clients={clients}
        workspaces={workspaces}
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
