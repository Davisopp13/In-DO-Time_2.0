"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Client } from "@/types";

export async function getClients(): Promise<Client[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getActiveClients(): Promise<Client[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function createClient(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const hourly_rate = parseFloat(formData.get("hourly_rate") as string) || 70;
  const color = (formData.get("color") as string) || "#84cc16";
  const notes = (formData.get("notes") as string) || null;

  if (!name?.trim()) {
    return { success: false, error: "Client name is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("clients").insert({
    name: name.trim(),
    email,
    hourly_rate,
    color,
    notes,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateClient(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const hourly_rate = parseFloat(formData.get("hourly_rate") as string) || 70;
  const color = (formData.get("color") as string) || "#84cc16";
  const notes = (formData.get("notes") as string) || null;

  if (!name?.trim()) {
    return { success: false, error: "Client name is required" };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: name.trim(),
      email,
      hourly_rate,
      color,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function archiveClient(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function restoreClient(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
