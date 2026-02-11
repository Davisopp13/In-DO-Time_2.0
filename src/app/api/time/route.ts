import { NextRequest } from "next/server";
import { validateApiKey, apiSuccess, apiError, createApiSupabaseClient } from "@/lib/api-auth";

interface TimeEntryRow {
  id: string;
  project_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  notes: string | null;
  is_manual: boolean;
  is_running: boolean;
  projects: {
    id: string;
    name: string;
    color: string;
    category: string;
    hourly_rate_override: number | null;
    client_id: string | null;
    clients: { id: string; name: string; hourly_rate: number } | null;
  } | null;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = request.nextUrl;
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");
  const project_id = searchParams.get("project_id");
  const client_id = searchParams.get("client_id");

  const supabase = createApiSupabaseClient();
  let query = supabase
    .from("time_entries")
    .select("*, projects(id, name, color, category, hourly_rate_override, client_id, clients(id, name, hourly_rate))")
    .eq("is_running", false)
    .order("start_time", { ascending: false });

  if (start_date) query = query.gte("start_time", `${start_date}T00:00:00`);
  if (end_date) query = query.lte("start_time", `${end_date}T23:59:59`);
  if (project_id) query = query.eq("project_id", project_id);

  const { data, error } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  // Cast to our known type
  let entries = (data ?? []) as unknown as TimeEntryRow[];

  // Filter by client_id if provided (post-query since client_id is on projects table)
  if (client_id) {
    entries = entries.filter((e) => e.projects?.client_id === client_id);
  }

  let totalSeconds = 0;
  let totalAmount = 0;

  const result = entries.map((e) => {
    const hourlyRate = e.projects?.hourly_rate_override ?? e.projects?.clients?.hourly_rate ?? 70;
    const durationSeconds = e.duration_seconds ?? 0;
    const durationHours = Math.round((durationSeconds / 3600) * 100) / 100;
    const amount = Math.round(durationHours * hourlyRate * 100) / 100;

    totalSeconds += durationSeconds;
    totalAmount += amount;

    return {
      id: e.id,
      date: e.start_time ? new Date(e.start_time).toISOString().split("T")[0] : null,
      start_time: e.start_time,
      end_time: e.end_time,
      duration_seconds: durationSeconds,
      duration_hours: durationHours,
      project_name: e.projects?.name ?? null,
      project_category: e.projects?.category ?? null,
      client_name: e.projects?.clients?.name ?? null,
      hourly_rate: hourlyRate,
      amount: amount,
      notes: e.notes,
      is_manual: e.is_manual,
    };
  });

  const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

  const response = {
    entries: result,
    totals: {
      total_entries: result.length,
      total_hours: totalHours,
      total_amount: Math.round(totalAmount * 100) / 100,
    },
  };

  const summary = `${result.length} time entr${result.length !== 1 ? "ies" : "y"} totaling ${totalHours}h ($${Math.round(totalAmount * 100) / 100})`;

  return apiSuccess(response, summary);
}
