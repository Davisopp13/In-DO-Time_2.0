"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Project, Client, Workspace } from "@/types";

export interface ProjectWithClient extends Project {
  clients: Pick<Client, "id" | "name" | "color"> | null;
  workspaces: Pick<Workspace, "id" | "name" | "color" | "icon">;
}

const DEFAULT_WORKSPACES: Record<string, any> = {
  '1': { id: '1', name: 'Hapag-Lloyd', color: '#fb923c', icon: 'Ship' },
  '2': { id: '2', name: 'DO Code Lab', color: '#8b5cf6', icon: 'Code' },
  '3': { id: '3', name: 'Personal', color: '#10b981', icon: 'User' },
  '4': { id: '4', name: 'DObot Development', color: '#06b6d4', icon: 'Bot' },
};

const CATEGORY_MAP: Record<string, string> = {
  'hapag': '1',
  'do_code_lab': '2',
  'personal': '3',
  'dobot': '4'
};

function mapLegacyProject(p: any): ProjectWithClient {
  const workspaceId = p.workspace_id || CATEGORY_MAP[p.category] || '3';
  return {
    ...p,
    workspace_id: workspaceId,
    workspaces: DEFAULT_WORKSPACES[workspaceId] || DEFAULT_WORKSPACES['3']
  } as ProjectWithClient;
}

export async function getProjects(): Promise<ProjectWithClient[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, name, color), workspaces(id, name, color, icon)")
    .order("sort_order")
    .order("name");

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("projects")
        .select("*, clients(id, name, color)")
        .order("sort_order")
        .order("name");

      if (legacyError) throw new Error(legacyError.message);
      return (legacyData ?? []).map(mapLegacyProject);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as ProjectWithClient[];
}

export async function getActiveProjects(): Promise<ProjectWithClient[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, name, color), workspaces(id, name, color, icon)")
    .in("status", ["active", "paused"])
    .order("sort_order")
    .order("name");

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("projects")
        .select("*, clients(id, name, color)")
        .in("status", ["active", "paused"])
        .order("sort_order")
        .order("name");

      if (legacyError) throw new Error(legacyError.message);
      return (legacyData ?? []).map(mapLegacyProject);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as ProjectWithClient[];
}

export async function getProject(id: string): Promise<ProjectWithClient | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, name, color), workspaces(id, name, color, icon)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("projects")
        .select("*, clients(id, name, color)")
        .eq("id", id)
        .single();

      if (legacyError) {
        if (legacyError.code === "PGRST116") return null;
        throw new Error(legacyError.message);
      }
      return mapLegacyProject(legacyData);
    }
    throw new Error(error.message);
  }
  return data as ProjectWithClient;
}

export async function createProject(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const client_id = (formData.get("client_id") as string) || null;
  const workspace_id = formData.get("workspace_id") as string;
  const status = (formData.get("status") as string) || "active";
  const color = (formData.get("color") as string) || "#84cc16";
  const hourly_rate_override_str = formData.get("hourly_rate_override") as string;
  const hourly_rate_override = hourly_rate_override_str ? parseFloat(hourly_rate_override_str) : null;

  if (!name?.trim()) {
    return { success: false, error: "Project name is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("projects").insert({
    name: name.trim(),
    description,
    client_id: client_id || null,
    workspace_id,
    status,
    color,
    hourly_rate_override,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/projects");
  return { success: true };
}

export async function updateProject(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const client_id = (formData.get("client_id") as string) || null;
  const workspace_id = formData.get("workspace_id") as string;
  const status = (formData.get("status") as string) || "active";
  const color = (formData.get("color") as string) || "#84cc16";
  const hourly_rate_override_str = formData.get("hourly_rate_override") as string;
  const hourly_rate_override = hourly_rate_override_str ? parseFloat(hourly_rate_override_str) : null;

  if (!name?.trim()) {
    return { success: false, error: "Project name is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: name.trim(),
      description,
      client_id: client_id || null,
      workspace_id,
      status,
      color,
      hourly_rate_override,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function archiveProject(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/projects");
  return { success: true };
}

export async function restoreProject(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/projects");
  return { success: true };
}
