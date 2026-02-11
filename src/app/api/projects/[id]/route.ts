import { NextRequest } from "next/server";
import { validateApiKey, apiSuccess, apiError, createApiSupabaseClient } from "@/lib/api-auth";

interface ProjectDetailRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  category: string;
  color: string;
  hourly_rate_override: number | null;
  clients: { id: string; name: string; color: string; hourly_rate: number } | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const supabase = createApiSupabaseClient();
  const { id } = params;

  // Get project detail
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("*, clients(id, name, color, hourly_rate)")
    .eq("id", id)
    .single();

  if (projectError) {
    if (projectError.code === "PGRST116") {
      return apiError("Project not found", 404);
    }
    return apiError(projectError.message, 500);
  }

  const project = projectData as unknown as ProjectDetailRow;

  // Fetch recent tasks, time entries, and notes in parallel
  const [tasksResult, timeResult, notesResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, priority, status, due_date, completed_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("time_entries")
      .select("id, start_time, end_time, duration_seconds, notes, is_running, is_manual")
      .eq("project_id", id)
      .order("start_time", { ascending: false })
      .limit(10),
    supabase
      .from("notes")
      .select("id, title, content, note_type, note_date, pinned")
      .eq("project_id", id)
      .order("note_date", { ascending: false })
      .limit(10),
  ]);

  const tasks = tasksResult.data ?? [];
  const timeEntries = timeResult.data ?? [];
  const notes = notesResult.data ?? [];

  // Calculate total hours for this project from fetched entries
  let totalSeconds = 0;
  for (const entry of timeEntries) {
    if (entry.is_running) {
      totalSeconds += Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
    } else {
      totalSeconds += entry.duration_seconds ?? 0;
    }
  }

  const result = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    category: project.category,
    color: project.color,
    hourly_rate_override: project.hourly_rate_override,
    client_name: project.clients?.name ?? null,
    client_hourly_rate: project.clients?.hourly_rate ?? null,
    recent_tasks: tasks,
    recent_time_entries: timeEntries.map((e) => ({
      ...e,
      duration_hours: e.duration_seconds ? Math.round((e.duration_seconds / 3600) * 100) / 100 : null,
    })),
    recent_notes: notes,
    total_hours_tracked: Math.round((totalSeconds / 3600) * 100) / 100,
    open_tasks: tasks.filter((t) => t.status !== "done").length,
    completed_tasks: tasks.filter((t) => t.status === "done").length,
  };

  return apiSuccess(result, `Project "${project.name}" with ${result.open_tasks} open tasks and ${result.total_hours_tracked}h tracked`);
}
