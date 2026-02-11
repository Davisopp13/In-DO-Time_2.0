"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Task, Project } from "@/types";

export interface TaskWithProject extends Task {
  projects: Pick<Project, "id" | "name" | "color" | "workspace_id"> | null;
}

const CATEGORY_MAP: Record<string, string> = {
  'hapag': '1',
  'do_code_lab': '2',
  'personal': '3',
  'dobot': '4'
};

function mapLegacyTask(t: any): TaskWithProject {
  if (!t.projects) return t as TaskWithProject;
  const workspaceId = t.projects.workspace_id || CATEGORY_MAP[t.projects.category] || '3';
  return {
    ...t,
    projects: {
      ...t.projects,
      workspace_id: workspaceId
    }
  } as TaskWithProject;
}

export async function getTasks(): Promise<TaskWithProject[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(id, name, color, workspace_id)")
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("tasks")
        .select("*, projects(id, name, color, category)")
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (legacyError) throw new Error(legacyError.message);
      return (legacyData ?? []).map(mapLegacyTask);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as TaskWithProject[];
}

export async function getTasksByProject(projectId: string): Promise<TaskWithProject[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(id, name, color, workspace_id)")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("tasks")
        .select("*, projects(id, name, color, category)")
        .eq("project_id", projectId)
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (legacyError) throw new Error(legacyError.message);
      return (legacyData ?? []).map(mapLegacyTask);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as TaskWithProject[];
}

export async function getTask(id: string): Promise<TaskWithProject | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(id, name, color, workspace_id)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("tasks")
        .select("*, projects(id, name, color, category)")
        .eq("id", id)
        .single();

      if (legacyError) {
        if (legacyError.code === "PGRST116") return null;
        throw new Error(legacyError.message);
      }
      return mapLegacyTask(legacyData);
    }
    throw new Error(error.message);
  }
  return data as TaskWithProject;
}

export async function createTask(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const project_id = (formData.get("project_id") as string) || null;
  const priority = (formData.get("priority") as string) || "p3";
  const status = (formData.get("status") as string) || "todo";
  const due_date = (formData.get("due_date") as string) || null;

  if (!title?.trim()) {
    return { success: false, error: "Task title is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("tasks").insert({
    title: title.trim(),
    description,
    project_id: project_id || null,
    priority,
    status,
    due_date: due_date || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function updateTask(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const project_id = (formData.get("project_id") as string) || null;
  const priority = (formData.get("priority") as string) || "p3";
  const status = (formData.get("status") as string) || "todo";
  const due_date = (formData.get("due_date") as string) || null;

  if (!title?.trim()) {
    return { success: false, error: "Task title is required" };
  }

  const completed_at = status === "done" ? new Date().toISOString() : null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      description,
      project_id: project_id || null,
      priority,
      status,
      due_date: due_date || null,
      completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function toggleTaskStatus(id: string, currentStatus: string): Promise<{ success: boolean; error?: string }> {
  const newStatus = currentStatus === "done" ? "todo" : "done";
  const completed_at = newStatus === "done" ? new Date().toISOString() : null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function updateTaskStatus(id: string, newStatus: string): Promise<{ success: boolean; error?: string }> {
  const completed_at = newStatus === "done" ? new Date().toISOString() : null;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}
