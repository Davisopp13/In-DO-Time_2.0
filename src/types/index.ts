export interface Client {
  id: string;
  name: string;
  email: string | null;
  hourly_rate: number;
  color: string;
  status: "active" | "archived";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: "active" | "paused" | "completed";
  color: string;
  hourly_rate_override: number | null;
  aliases: string[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  priority: "p1" | "p2" | "p3" | "p4";
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  notes: string | null;
  is_manual: boolean;
  is_running: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  project_id: string | null;
  title: string | null;
  content: string;
  note_type: "general" | "daily_journal" | "meeting" | "idea";
  note_date: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}
