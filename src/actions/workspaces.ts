"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Workspace } from "@/types";

export async function getWorkspaces(): Promise<Workspace[]> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("name");

    if (error) {
        // If table doesn't exist yet (migration not run), return hardcoded defaults for now
        // We check for Postgres code 42P01 and PostgREST schema cache errors
        if (
            error.code === "42P01" ||
            error.code === "PGRST200" ||
            error.message?.includes("schema cache") ||
            error.message?.includes("Could not find the table")
        ) {
            return [
                {
                    id: "1",
                    name: "Hapag-Lloyd",
                    slug: "hapag-lloyd",
                    color: "#38bdf8",
                    icon: "Ship",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    id: "2",
                    name: "DO Code Lab",
                    slug: "do-code-lab",
                    color: "#84cc16",
                    icon: "Code",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    id: "3",
                    name: "Personal",
                    slug: "personal",
                    color: "#10b981",
                    icon: "User",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    id: "4",
                    name: "DObot Development",
                    slug: "dobot-development",
                    color: "#fb923c",
                    icon: "Bot",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }
            ];
        }
        throw new Error(error.message);
    }
    return (data ?? []) as Workspace[];
}
