import { NextRequest } from "next/server";
import { validateApiKey, apiSuccess, apiError, createApiSupabaseClient } from "@/lib/api-auth";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  projects: { id: string; name: string; color: string; category: string } | null;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const supabase = createApiSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // Get tasks that are due today, overdue (due before today and not done), or in_progress
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(id, name, color, category)")
    .or(`due_date.eq.${today},and(due_date.lt.${today},status.neq.done),status.eq.in_progress`)
    .order("priority")
    .order("due_date");

  if (error) {
    return apiError(error.message, 500);
  }

  const rows = (data ?? []) as unknown as TaskRow[];
  const priorityOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };
  const statusOrder: Record<string, number> = { in_progress: 0, todo: 1, done: 2 };

  const tasks = [...rows]
    .sort((a, b) => {
      const statusDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
      if (statusDiff !== 0) return statusDiff;
      return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    })
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      completed_at: t.completed_at,
      project_name: t.projects?.name ?? null,
      project_category: t.projects?.category ?? null,
      is_overdue: t.due_date ? t.due_date < today && t.status !== "done" : false,
    }));

  const overdue = tasks.filter((t) => t.is_overdue).length;
  const dueToday = tasks.filter((t) => t.due_date === today).length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  const summary = `You have ${dueToday} task${dueToday !== 1 ? "s" : ""} due today, ${overdue} overdue, ${inProgress} in progress`;

  return apiSuccess(tasks, summary);
}
