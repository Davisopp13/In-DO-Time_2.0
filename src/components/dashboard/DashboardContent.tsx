"use client";

import { useMemo } from "react";
import { useWorkspace } from "@/lib/workspace";
import type { TaskWithProject } from "@/actions/tasks";
import type { ProjectWithClient } from "@/actions/projects";
import type { getTodaysTimeSummary } from "@/actions/time-entries";
import type { NoteWithProject } from "@/actions/notes";
import DashboardGreeting from "./DashboardGreeting";
import StatsRow from "./StatsRow";
import FocusTask from "./FocusTask";
import ActiveTimersStrip from "./ActiveTimersStrip";
import DashboardTaskList from "./DashboardTaskList";
import DashboardJournal from "./DashboardJournal";
import DashboardProjects from "./DashboardProjects";

interface DashboardContentProps {
    initialTasks: TaskWithProject[];
    initialProjects: ProjectWithClient[];
    timeSummary: Awaited<ReturnType<typeof getTodaysTimeSummary>>;
    notes: NoteWithProject[];
}

function getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function computeDashboardStats(tasks: TaskWithProject[]) {
    const today = getTodayStr();

    // Tasks remaining = not done
    const tasksRemaining = tasks.filter((t) => t.status !== "done").length;

    // Tasks due today (regardless of status)
    const dueToday = tasks.filter(
        (t) => t.due_date === today && t.status !== "done"
    ).length;

    // Overdue = due before today and not done
    const overdue = tasks.filter(
        (t) => t.due_date && t.due_date < today && t.status !== "done"
    ).length;

    // Tasks done today (completed_at is today)
    const tasksDoneToday = tasks.filter((t) => {
        if (t.status !== "done" || !t.completed_at) return false;
        return t.completed_at.startsWith(today);
    }).length;

    // Total tasks that were relevant today = done today + still due today + overdue
    const totalTasksToday = tasksDoneToday + dueToday + overdue;

    return { tasksRemaining, dueToday, overdue, tasksDoneToday, totalTasksToday };
}

function getFocusTask(tasks: TaskWithProject[]): TaskWithProject | null {
    const priorityOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };
    const statusOrder: Record<string, number> = { in_progress: 0, todo: 1 };

    const candidates = tasks
        .filter((t) => t.status !== "done")
        .sort((a, b) => {
            const statusDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
            if (statusDiff !== 0) return statusDiff;
            return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
        });

    return candidates[0] ?? null;
}

export default function DashboardContent({
    initialTasks,
    initialProjects,
    timeSummary,
    notes,
}: DashboardContentProps) {
    const { currentWorkspace } = useWorkspace();
    const today = getTodayStr();

    // Filtering based on current workspace
    const tasks = useMemo(() => {
        return initialTasks.filter((t) => !currentWorkspace || t.projects?.workspace_id === currentWorkspace.id);
    }, [initialTasks, currentWorkspace]);

    const activeProjects = useMemo(() => {
        return initialProjects.filter((p) => !currentWorkspace || p.workspace_id === currentWorkspace.id);
    }, [initialProjects, currentWorkspace]);

    const stats = useMemo(() => computeDashboardStats(tasks), [tasks]);
    const focusTask = useMemo(() => getFocusTask(tasks), [tasks]);

    const todaysJournal = useMemo(() => {
        return notes.find((n) => n.note_type === "daily_journal" && n.note_date === today) ?? null;
    }, [notes, today]);

    const todaysTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (t.due_date === today) return true;
            if (t.due_date && t.due_date < today && t.status !== "done") return true;
            if (t.status === "in_progress") return true;
            if (t.status === "done" && t.completed_at?.startsWith(today)) return true;
            return false;
        });
    }, [tasks, today]);

    return (
        <div className="space-y-6">
            {/* Row 0: Greeting */}
            <DashboardGreeting tasksRemaining={stats.tasksRemaining} />

            {/* Row 1: Stats + Focus Task */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <StatsRow
                        tasksDoneToday={stats.tasksDoneToday}
                        totalTasksToday={stats.totalTasksToday}
                        activeProjects={activeProjects.length}
                        dueToday={stats.dueToday}
                        overdue={stats.overdue}
                        hoursToday={timeSummary.totalHours}
                    />
                </div>
                <div>
                    <FocusTask task={focusTask} />
                </div>
            </div>

            {/* Row 2: Active Timers Strip */}
            <ActiveTimersStrip />

            {/* Row 3: Today's Tasks */}
            <DashboardTaskList tasks={todaysTasks} />

            {/* Row 4: Journal Preview + Active Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DashboardJournal todaysJournal={todaysJournal} />
                <DashboardProjects projects={activeProjects} tasks={tasks} />
            </div>
        </div>
    );
}
