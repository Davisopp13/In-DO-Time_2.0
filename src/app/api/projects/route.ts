import { NextRequest } from "next/server";
import { validateApiKey, apiSuccess, apiError, createApiSupabaseClient } from "@/lib/api-auth";

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  category: string;
  color: string;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string; color: string } | null;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const supabase = createApiSupabaseClient();

  // Get all projects with client data
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*, clients(id, name, color)")
    .order("sort_order")
    .order("name");

  if (projectsError) {
    return apiError(projectsError.message, 500);
  }

  // Get open task counts per project
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, status")
    .neq("status", "done");

  if (tasksError) {
    return apiError(tasksError.message, 500);
  }

  const openTaskCounts = new Map<string, number>();
  for (const task of tasks ?? []) {
    if (task.project_id) {
      openTaskCounts.set(task.project_id, (openTaskCounts.get(task.project_id) ?? 0) + 1);
    }
  }

  const rows = (projects ?? []) as unknown as ProjectRow[];
  const result = rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    category: p.category,
    color: p.color,
    client_name: p.clients?.name ?? null,
    open_task_count: openTaskCounts.get(p.id) ?? 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const active = result.filter((p) => p.status === "active").length;
  const summary = `${result.length} project${result.length !== 1 ? "s" : ""} total, ${active} active`;

  return apiSuccess(result, summary);
}
