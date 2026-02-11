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
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; color: string; category: string } | null;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const project_id = searchParams.get("project_id");
  const due_date = searchParams.get("due_date");

  const supabase = createApiSupabaseClient();
  let query = supabase
    .from("tasks")
    .select("*, projects(id, name, color, category)")
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (project_id) query = query.eq("project_id", project_id);
  if (due_date) query = query.eq("due_date", due_date);

  const { data, error } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  const rows = (data ?? []) as unknown as TaskRow[];
  const tasks = rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    due_date: t.due_date,
    completed_at: t.completed_at,
    project_name: t.projects?.name ?? null,
    project_category: t.projects?.category ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  const summary = `${tasks.length} task${tasks.length !== 1 ? "s" : ""} found${status ? ` with status "${status}"` : ""}${priority ? ` at priority ${priority}` : ""}`;

  return apiSuccess(tasks, summary);
}
