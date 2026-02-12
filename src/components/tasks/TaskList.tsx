"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, CheckSquare, List, LayoutGrid, Search } from "lucide-react";
import type { TaskWithProject } from "@/actions/tasks";
import { toggleTaskStatus, deleteTask } from "@/actions/tasks";
import type { ProjectWithClient } from "@/actions/projects";
import { useWorkspace } from "@/lib/workspace";
import TaskRow from "./TaskRow";
import TaskFormModal from "./TaskFormModal";
import KanbanBoard from "./KanbanBoard";

type StatusFilter = "all" | "todo" | "in_progress" | "done";
type ViewMode = "list" | "kanban";

const FILTER_PILLS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface TaskListProps {
  initialTasks: TaskWithProject[];
  projects: ProjectWithClient[];
}

function sortTasks(tasks: TaskWithProject[]): TaskWithProject[] {
  const priorityOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };
  const statusOrder: Record<string, number> = { in_progress: 0, todo: 1, done: 2 };

  return [...tasks].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
    if (statusDiff !== 0) return statusDiff;
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });
}

export default function TaskList({ initialTasks, projects }: TaskListProps) {
  const { currentWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Global Workspace Filtering — include standalone tasks (no project) in every workspace
  const workspaceTasks = useMemo(() => {
    return tasks.filter((t) => !currentWorkspace || !t.projects || t.projects.workspace_id === currentWorkspace.id);
  }, [tasks, currentWorkspace]);

  const workspaceProjects = useMemo(() => {
    return projects.filter((p) => !currentWorkspace || p.workspace_id === currentWorkspace.id);
  }, [projects, currentWorkspace]);

  // Secondary filtering (Project, Status, Search)
  const filteredTasks = useMemo(() => {
    let result = workspaceTasks;

    if (projectFilter !== "all") {
      result = result.filter((t) => t.project_id === projectFilter);
    }

    if (filter !== "all") {
      result = result.filter((t) => t.status === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    return sortTasks(result);
  }, [workspaceTasks, projectFilter, filter, searchQuery]);

  const countsByStatus = useMemo(() => {
    const baseTasks = projectFilter === "all"
      ? workspaceTasks
      : workspaceTasks.filter(t => t.project_id === projectFilter);

    return {
      all: baseTasks.length,
      todo: baseTasks.filter((t) => t.status === "todo").length,
      in_progress: baseTasks.filter((t) => t.status === "in_progress").length,
      done: baseTasks.filter((t) => t.status === "done").length,
    };
  }, [workspaceTasks, projectFilter]);

  const handleToggle = useCallback(async (id: string, currentStatus: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
            ...t,
            status: (currentStatus === "done" ? "todo" : "done") as "todo" | "done",
            completed_at: currentStatus === "done" ? null : new Date().toISOString(),
          }
          : t
      )
    );

    const result = await toggleTaskStatus(id, currentStatus);
    if (!result.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: currentStatus as "todo" | "in_progress" | "done" } : t
        )
      );
    }
  }, []);

  const handleEdit = useCallback((task: TaskWithProject) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteTask(id);
    if (result.success) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const handleSaved = useCallback(() => {
    window.location.reload();
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingTask(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="trail-marker">Workspace Tasks</p>
          <h1 className="text-3xl font-bold text-[var(--heading)] mt-1">
            {currentWorkspace?.name ?? "All Tasks"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-2xl glass border-[var(--border)]">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${viewMode === "list"
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              <List size={14} />
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${viewMode === "kanban"
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-bold shadow-lg shadow-[var(--accent-glow)] hover:bg-[var(--accent-hover)] transition-all active:scale-95"
          >
            <Plus size={18} />
            New Task
          </button>
        </div>
      </div>

      {/* Global Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between p-4 rounded-2xl glass border-[var(--border)]">
        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {FILTER_PILLS.map((pill) => {
            const isActive = filter === pill.value;
            const count = countsByStatus[pill.value];
            return (
              <button
                key={pill.value}
                onClick={() => setFilter(pill.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 border ${isActive
                  ? "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent)]"
                  : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
                  }`}
              >
                {pill.label}
                {count > 0 && <span className="opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Project dropdown */}
          {workspaceProjects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold focus:outline-none focus:border-[var(--accent)] cursor-pointer appearance-none pr-10 hover:border-[var(--border-hover)]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option value="all">All Projects</option>
              {workspaceProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {viewMode === "kanban" ? (
          <KanbanBoard
            tasks={filteredTasks}
            onTasksChange={setTasks}
            onEdit={handleEdit}
          />
        ) : filteredTasks.length === 0 ? (
          <div className="glass p-20 text-center border-dashed border-2 border-[var(--border)]">
            <CheckSquare size={48} className="text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-[var(--text-primary)]">No tasks found</h3>
            <p className="text-[var(--text-muted)] max-w-sm mx-auto mt-2">
              Try adjusting your filters or create a new task to get started.
            </p>
            <button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              className="mt-6 text-[var(--accent)] font-bold hover:underline"
            >
              Create first task →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <TaskFormModal
        task={editingTask}
        projects={workspaceProjects}
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />
    </div>
  );
}
