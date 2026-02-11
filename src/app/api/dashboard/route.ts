import { NextRequest } from "next/server";
import { validateApiKey, apiSuccess, apiError, createApiSupabaseClient } from "@/lib/api-auth";

interface TaskRow {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  project_id: string | null;
  projects: { id: string; name: string } | null;
}

interface TimerRow {
  id: string;
  start_time: string;
  project_id: string;
  projects: { id: string; name: string } | null;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const supabase = createApiSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString();

  // Fetch all data in parallel
  const [tasksResult, projectsResult, todayEntriesResult, weekEntriesResult, runningTimersResult, completedTodayResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, priority, status, due_date, completed_at, project_id, projects(id, name)")
      .neq("status", "done"),
    supabase
      .from("projects")
      .select("id")
      .in("status", ["active", "paused"]),
    supabase
      .from("time_entries")
      .select("id, start_time, end_time, duration_seconds, is_running, project_id")
      .gte("start_time", `${today}T00:00:00`)
      .lte("start_time", `${today}T23:59:59`),
    supabase
      .from("time_entries")
      .select("id, duration_seconds, is_running, start_time")
      .gte("start_time", weekStart)
      .eq("is_running", false),
    supabase
      .from("time_entries")
      .select("id, start_time, project_id, projects(id, name)")
      .eq("is_running", true),
    supabase
      .from("tasks")
      .select("id")
      .eq("status", "done")
      .gte("completed_at", `${today}T00:00:00`)
      .lte("completed_at", `${today}T23:59:59`),
  ]);

  if (tasksResult.error) return apiError(tasksResult.error.message, 500);
  if (projectsResult.error) return apiError(projectsResult.error.message, 500);
  if (todayEntriesResult.error) return apiError(todayEntriesResult.error.message, 500);
  if (weekEntriesResult.error) return apiError(weekEntriesResult.error.message, 500);
  if (runningTimersResult.error) return apiError(runningTimersResult.error.message, 500);

  const allTasks = (tasksResult.data ?? []) as unknown as TaskRow[];
  const todayEntries = todayEntriesResult.data ?? [];
  const weekEntries = weekEntriesResult.data ?? [];
  const runningTimers = (runningTimersResult.data ?? []) as unknown as TimerRow[];
  const completedTodayCount = completedTodayResult.data?.length ?? 0;

  // Tasks today: due today or overdue
  const tasksDueToday = allTasks.filter((t) => t.due_date === today);
  const tasksOverdue = allTasks.filter((t) => t.due_date && t.due_date < today);

  // Hours today
  let todaySeconds = 0;
  for (const entry of todayEntries) {
    if (entry.is_running) {
      todaySeconds += Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
    } else {
      todaySeconds += entry.duration_seconds ?? 0;
    }
  }
  const hoursToday = Math.round((todaySeconds / 3600) * 100) / 100;

  // Hours this week
  let weekSeconds = 0;
  for (const entry of weekEntries) {
    weekSeconds += entry.duration_seconds ?? 0;
  }
  // Add running timers that started this week
  for (const timer of runningTimers) {
    if (new Date(timer.start_time) >= monday) {
      weekSeconds += Math.floor((Date.now() - new Date(timer.start_time).getTime()) / 1000);
    }
  }
  const hoursThisWeek = Math.round((weekSeconds / 3600) * 100) / 100;

  // Active timers
  const activeTimers = runningTimers.map((t) => ({
    project_name: t.projects?.name ?? "Unknown",
    elapsed_seconds: Math.floor((Date.now() - new Date(t.start_time).getTime()) / 1000),
  }));

  // Focus task: highest priority non-done task
  const priorityOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };
  const statusOrder: Record<string, number> = { in_progress: 0, todo: 1 };
  const sorted = [...allTasks].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1);
    if (statusDiff !== 0) return statusDiff;
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
  });
  const focusTask = sorted[0]
    ? {
        title: sorted[0].title,
        priority: sorted[0].priority,
        project_name: sorted[0].projects?.name ?? null,
        due_date: sorted[0].due_date,
      }
    : null;

  const dashboard = {
    tasks_today: {
      total: tasksDueToday.length + completedTodayCount,
      completed: completedTodayCount,
      overdue: tasksOverdue.length,
    },
    active_projects: projectsResult.data?.length ?? 0,
    hours_today: hoursToday,
    hours_this_week: hoursThisWeek,
    active_timers: activeTimers,
    focus_task: focusTask,
  };

  const summary = `You have ${tasksDueToday.length} task${tasksDueToday.length !== 1 ? "s" : ""} due today, ${tasksOverdue.length} overdue. ${hoursToday}h tracked today, ${hoursThisWeek}h this week. ${activeTimers.length} timer${activeTimers.length !== 1 ? "s" : ""} running.`;

  return apiSuccess(dashboard, summary);
}
