"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { TimeEntry, Project, Client } from "@/types";

export interface TimeEntryWithProject extends TimeEntry {
  projects: Pick<Project, "id" | "name" | "color" | "workspace_id" | "hourly_rate_override"> & {
    clients: Pick<Client, "id" | "name" | "hourly_rate"> | null;
  };
}

// ============================================
// QUERIES
// ============================================

const CATEGORY_MAP: Record<string, string> = {
  'hapag': '1',
  'do_code_lab': '2',
  'personal': '3',
  'dobot': '4'
};

function mapLegacyTimeEntry(te: any): TimeEntryWithProject {
  if (!te.projects) return te as TimeEntryWithProject;
  const workspaceId = te.projects.workspace_id || CATEGORY_MAP[te.projects.category] || '3';
  return {
    ...te,
    projects: {
      ...te.projects,
      workspace_id: workspaceId
    }
  } as TimeEntryWithProject;
}

export async function getTimeEntries(options?: {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<TimeEntryWithProject[]> {
  const supabase = createServerSupabaseClient();
  const selectQuery = "*, projects(id, name, color, workspace_id, hourly_rate_override, clients(id, name, hourly_rate))";

  let query = supabase.from("time_entries").select(selectQuery);

  if (options?.projectId) query = query.eq("project_id", options.projectId);
  if (options?.startDate) query = query.gte("start_time", options.startDate);
  if (options?.endDate) query = query.lte("start_time", options.endDate);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query.order("start_time", { ascending: false });

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const legacySelect = "*, projects(id, name, color, category, hourly_rate_override, clients(id, name, hourly_rate))";
      let legacyQuery = supabase.from("time_entries").select(legacySelect);

      if (options?.projectId) legacyQuery = legacyQuery.eq("project_id", options.projectId);
      if (options?.startDate) legacyQuery = legacyQuery.gte("start_time", options.startDate);
      if (options?.endDate) legacyQuery = legacyQuery.lte("start_time", options.endDate);
      if (options?.limit) legacyQuery = legacyQuery.limit(options.limit);

      const { data: qData, error: qError } = await legacyQuery.order("start_time", { ascending: false });
      if (qError) throw new Error(qError.message);
      return (qData as any[] ?? []).map(mapLegacyTimeEntry);
    }
    throw new Error(error.message);
  }
  return (data as any[] ?? []) as TimeEntryWithProject[];
}

export async function getTimeEntriesByProject(projectId: string): Promise<TimeEntryWithProject[]> {
  return getTimeEntries({ projectId });
}

export async function getRunningTimers(): Promise<TimeEntryWithProject[]> {
  const supabase = createServerSupabaseClient();
  const selectQuery = "*, projects(id, name, color, workspace_id, hourly_rate_override, clients(id, name, hourly_rate))";

  const { data, error } = await supabase
    .from("time_entries")
    .select(selectQuery)
    .eq("is_running", true)
    .order("start_time", { ascending: false });

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const legacySelect = "*, projects(id, name, color, category, hourly_rate_override, clients(id, name, hourly_rate))";
      const { data: qData, error: qError } = await supabase
        .from("time_entries")
        .select(legacySelect)
        .eq("is_running", true)
        .order("start_time", { ascending: false });

      if (qError) throw new Error(qError.message);
      return (qData as any[] ?? []).map(mapLegacyTimeEntry);
    }
    throw new Error(error.message);
  }
  return (data as any[] ?? []) as TimeEntryWithProject[];
}

export async function getTodaysTimeEntries(): Promise<TimeEntryWithProject[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.toISOString();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfDay = tomorrow.toISOString();

  return getTimeEntries({ startDate: startOfDay, endDate: endOfDay });
}

export async function getTimeEntry(id: string): Promise<TimeEntryWithProject | null> {
  const supabase = createServerSupabaseClient();
  const selectQuery = "*, projects(id, name, color, workspace_id, hourly_rate_override, clients(id, name, hourly_rate))";

  const { data, error } = await supabase
    .from("time_entries")
    .select(selectQuery)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const legacySelect = "*, projects(id, name, color, category, hourly_rate_override, clients(id, name, hourly_rate))";
      const { data: qData, error: qError } = await supabase
        .from("time_entries")
        .select(legacySelect)
        .eq("id", id)
        .single();

      if (qError) {
        if (qError.code === "PGRST116") return null;
        throw new Error(qError.message);
      }
      return mapLegacyTimeEntry(qData);
    }
    throw new Error(error.message);
  }
  return data as any as TimeEntryWithProject;
}

// ============================================
// TIMER ACTIONS (start, stop, pause)
// ============================================

export async function startTimer(
  projectId: string,
  taskId?: string | null
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!projectId) {
    return { success: false, error: "Project is required to start a timer" };
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      project_id: projectId,
      task_id: taskId || null,
      start_time: new Date().toISOString(),
      is_running: true,
      is_manual: false,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/timers");
  revalidatePath("/");
  return { success: true, id: data.id };
}

export async function stopTimer(
  id: string,
  notes?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  // Get the entry to calculate duration
  const { data: entry, error: fetchError } = await supabase
    .from("time_entries")
    .select("start_time, is_running")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!entry?.is_running) {
    return { success: false, error: "Timer is not running" };
  }

  const now = new Date();
  const startTime = new Date(entry.start_time);
  const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  const updateData: Record<string, unknown> = {
    end_time: now.toISOString(),
    duration_seconds: durationSeconds,
    is_running: false,
    updated_at: now.toISOString(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from("time_entries")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/timers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function pauseTimer(
  id: string
): Promise<{ success: boolean; error?: string; projectId?: string; taskId?: string | null }> {
  // Pause = stop current entry (creates a completed block).
  // Returns project/task info so the UI can show a "resume" button.
  const supabase = createServerSupabaseClient();

  // Get the entry to calculate duration and return project/task info
  const { data: entry, error: fetchError } = await supabase
    .from("time_entries")
    .select("start_time, is_running, project_id, task_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!entry?.is_running) {
    return { success: false, error: "Timer is not running" };
  }

  const now = new Date();
  const startTime = new Date(entry.start_time);
  const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

  const { error } = await supabase
    .from("time_entries")
    .update({
      end_time: now.toISOString(),
      duration_seconds: durationSeconds,
      is_running: false,
      updated_at: now.toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/timers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true, projectId: entry.project_id, taskId: entry.task_id };
}

export async function resumeTimer(
  projectId: string,
  taskId?: string | null
): Promise<{ success: boolean; error?: string; id?: string }> {
  // Resume = start a new time entry for the same project/task
  return startTimer(projectId, taskId);
}

// ============================================
// MANUAL ENTRY
// ============================================

export async function createManualTimeEntry(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const project_id = formData.get("project_id") as string;
  const task_id = (formData.get("task_id") as string) || null;
  const date = formData.get("date") as string;
  const start_time_str = formData.get("start_time") as string;
  const end_time_str = formData.get("end_time") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!project_id) {
    return { success: false, error: "Project is required" };
  }
  if (!date || !start_time_str || !end_time_str) {
    return { success: false, error: "Date, start time, and end time are required" };
  }

  // Build full ISO timestamps from date + time inputs
  const startTime = new Date(`${date}T${start_time_str}`);
  const endTime = new Date(`${date}T${end_time_str}`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return { success: false, error: "Invalid date or time format" };
  }

  if (endTime <= startTime) {
    return { success: false, error: "End time must be after start time" };
  }

  const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("time_entries").insert({
    project_id,
    task_id: task_id || null,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_seconds: durationSeconds,
    notes,
    is_manual: true,
    is_running: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/timers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

// ============================================
// UPDATE & DELETE
// ============================================

export async function updateTimeEntry(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const project_id = formData.get("project_id") as string;
  const task_id = (formData.get("task_id") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!project_id) {
    return { success: false, error: "Project is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("time_entries")
    .update({
      project_id,
      task_id: task_id || null,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/timers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteTimeEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  // Don't allow deleting a running timer — stop it first
  const { data: entry } = await supabase
    .from("time_entries")
    .select("is_running")
    .eq("id", id)
    .single();

  if (entry?.is_running) {
    return { success: false, error: "Cannot delete a running timer. Stop it first." };
  }

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/timers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

// ============================================
// SUMMARY HELPERS
// ============================================

export async function getTodaysTimeSummary(): Promise<{
  totalSeconds: number;
  totalHours: number;
  byProject: { projectId: string; projectName: string; projectColor: string; seconds: number; hours: number }[];
}> {
  const entries = await getTodaysTimeEntries();
  const now = new Date();

  let totalSeconds = 0;
  const projectMap = new Map<string, { projectName: string; projectColor: string; seconds: number }>();

  for (const entry of entries) {
    let seconds: number;
    if (entry.is_running) {
      // Calculate live duration from start_time
      seconds = Math.floor((now.getTime() - new Date(entry.start_time).getTime()) / 1000);
    } else {
      seconds = entry.duration_seconds ?? 0;
    }

    totalSeconds += seconds;

    const existing = projectMap.get(entry.project_id);
    if (existing) {
      existing.seconds += seconds;
    } else {
      projectMap.set(entry.project_id, {
        projectName: entry.projects.name,
        projectColor: entry.projects.color,
        seconds,
      });
    }
  }

  const byProject = Array.from(projectMap.entries()).map(([projectId, data]) => ({
    projectId,
    projectName: data.projectName,
    projectColor: data.projectColor,
    seconds: data.seconds,
    hours: Math.round((data.seconds / 3600) * 100) / 100,
  }));

  return {
    totalSeconds,
    totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
    byProject,
  };
}
