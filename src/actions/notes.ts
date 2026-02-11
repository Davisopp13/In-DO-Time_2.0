"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Note, Project } from "@/types";

export interface NoteWithProject extends Note {
  projects: Pick<Project, "id" | "name" | "color" | "workspace_id"> | null;
}

const CATEGORY_MAP: Record<string, string> = {
  'hapag': '1',
  'do_code_lab': '2',
  'personal': '3',
  'dobot': '4'
};

function mapLegacyNote(n: any): NoteWithProject {
  if (!n.projects) return n as NoteWithProject;
  const workspaceId = n.projects.workspace_id || CATEGORY_MAP[n.projects.category] || '3';
  return {
    ...n,
    projects: {
      ...n.projects,
      workspace_id: workspaceId
    }
  } as NoteWithProject;
}

export async function getNotes(): Promise<NoteWithProject[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*, projects(id, name, color, workspace_id)")
    .order("pinned", { ascending: false })
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("notes")
        .select("*, projects(id, name, color, category)")
        .order("pinned", { ascending: false })
        .order("note_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (legacyError) throw new Error(legacyError.message);
      return (legacyData ?? []).map(mapLegacyNote);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as NoteWithProject[];
}

export async function getNotesByProject(projectId: string): Promise<NoteWithProject[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*, projects(id, name, color, workspace_id)")
    .eq("project_id", projectId)
    .order("pinned", { ascending: false })
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("notes")
        .select("*, projects(id, name, color, category)")
        .eq("project_id", projectId)
        .order("pinned", { ascending: false })
        .order("note_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (legacyError) throw new Error(legacyError.message);
      return (legacyData ?? []).map(mapLegacyNote);
    }
    throw new Error(error.message);
  }
  return (data ?? []) as NoteWithProject[];
}

export async function getNote(id: string): Promise<NoteWithProject | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*, projects(id, name, color, workspace_id)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    if (error.message?.includes("workspace_id") || error.message?.includes("workspaces") || error.message?.includes("schema cache")) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("notes")
        .select("*, projects(id, name, color, category)")
        .eq("id", id)
        .single();

      if (legacyError) {
        if (legacyError.code === "PGRST116") return null;
        throw new Error(legacyError.message);
      }
      return mapLegacyNote(legacyData);
    }
    throw new Error(error.message);
  }
  return data as NoteWithProject;
}

export async function createNote(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const title = (formData.get("title") as string) || null;
  const content = formData.get("content") as string;
  const project_id = (formData.get("project_id") as string) || null;
  const note_type = (formData.get("note_type") as string) || "general";
  const note_date = (formData.get("note_date") as string) || new Date().toISOString().split("T")[0];
  const pinned = formData.get("pinned") === "true";

  if (!content?.trim()) {
    return { success: false, error: "Note content is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("notes").insert({
    title: title?.trim() || null,
    content: content.trim(),
    project_id: project_id || null,
    note_type,
    note_date,
    pinned,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true };
}

export async function updateNote(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const title = (formData.get("title") as string) || null;
  const content = formData.get("content") as string;
  const project_id = (formData.get("project_id") as string) || null;
  const note_type = (formData.get("note_type") as string) || "general";
  const note_date = (formData.get("note_date") as string) || new Date().toISOString().split("T")[0];
  const pinned = formData.get("pinned") === "true";

  if (!content?.trim()) {
    return { success: false, error: "Note content is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notes")
    .update({
      title: title?.trim() || null,
      content: content.trim(),
      project_id: project_id || null,
      note_type,
      note_date,
      pinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true };
}

export async function toggleNotePin(id: string, currentPinned: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notes")
    .update({
      pinned: !currentPinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true };
}

export async function deleteNote(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notes");
  revalidatePath("/");
  return { success: true };
}
