import { NextRequest } from "next/server";
import { validateApiKey, apiSuccess, apiError, createApiSupabaseClient } from "@/lib/api-auth";

interface NoteRow {
  id: string;
  title: string | null;
  content: string;
  note_type: string;
  note_date: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; color: string; category: string } | null;
}

export async function GET(request: NextRequest) {
  const auth = await validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = request.nextUrl;
  const project_id = searchParams.get("project_id");
  const type = searchParams.get("type");
  const limitStr = searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  const supabase = createApiSupabaseClient();
  let query = supabase
    .from("notes")
    .select("*, projects(id, name, color, category)")
    .order("pinned", { ascending: false })
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (project_id) query = query.eq("project_id", project_id);
  if (type) query = query.eq("note_type", type);

  const { data, error } = await query;

  if (error) {
    return apiError(error.message, 500);
  }

  const rows = (data ?? []) as unknown as NoteRow[];
  const notes = rows.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    note_type: n.note_type,
    note_date: n.note_date,
    pinned: n.pinned,
    project_name: n.projects?.name ?? null,
    project_category: n.projects?.category ?? null,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }));

  const summary = `${notes.length} note${notes.length !== 1 ? "s" : ""} returned${type ? ` of type "${type}"` : ""}`;

  return apiSuccess(notes, summary);
}
