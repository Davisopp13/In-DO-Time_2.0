"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type TableName = "tasks" | "projects" | "notes" | "time_entries";

interface RealtimeEvent {
  table: TableName;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, any>;
  old: Record<string, any>;
}

interface UseRealtimeSyncOptions {
  /** Tables to subscribe to */
  tables?: TableName[];
  /** Called when any change is received */
  onDataChange: (event: RealtimeEvent) => void;
  /** Whether to enable subscriptions. Default true */
  enabled?: boolean;
}

const DEFAULT_TABLES: TableName[] = ["tasks", "projects", "notes", "time_entries"];

export function useRealtimeSync({
  tables = DEFAULT_TABLES,
  onDataChange,
  enabled = true,
}: UseRealtimeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onDataChangeRef = useRef(onDataChange);
  onDataChangeRef.current = onDataChange;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const supabase = createClient();

    // Create a single channel for all table subscriptions
    let channel = supabase.channel("app-realtime");

    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          onDataChangeRef.current({
            table: table as TableName,
            eventType: payload.eventType as RealtimeEvent["eventType"],
            new: (payload.new as Record<string, any>) ?? {},
            old: (payload.old as Record<string, any>) ?? {},
          });
        }
      );
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[realtime] Connected to real-time channel");
      } else if (status === "CHANNEL_ERROR") {
        console.error("[realtime] Channel error — will retry");
      }
    });

    channelRef.current = channel;

    return cleanup;
  }, [enabled, tables, cleanup]);
}
