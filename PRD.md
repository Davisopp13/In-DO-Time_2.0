# In DO Time — Full Build PRD for Claude Code

> **Context for Claude Code (ralph):** This is a comprehensive build prompt for "In DO Time" — Davis's personal command center and time tracking PWA. This combines what was originally two separate apps: a time tracker for DO Code Lab client billing and a personal operations center (formerly called "DOjo"). The design follows a "Dark Mode Mountain" glassmorphism aesthetic with light/dark mode support. You have up to 50 iterations. Build methodically, test as you go, and ship something solid.

---

## Project Overview

**In DO Time** is a cross-device personal command center and time tracking PWA for Davis, a solo developer running DO Code Lab (freelance web development) while working as a Client Support & Operations Specialist at Hapag-Lloyd. The app serves two interconnected purposes:

1. **Time Tracking** — Multi-timer dashboard for tracking billable hours across DO Code Lab clients, with exportable reports for invoicing at $70/hour
2. **Operations Center** — Project management, task engine, notes/journal system, and a read-only API for DObot (Davis's AI assistant) to query

The name "In DO Time" carries a triple meaning: clocking in + "in due time, everything gets done" + the "DO" brand from DO Code Lab.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, Server Components, Server Actions) |
| Database | Supabase (Postgres + Auth + Realtime) |
| Auth | Supabase Magic Link (single user for now) |
| Styling | TailwindCSS 3.4+ |
| Components | shadcn/ui (dialogs, dropdowns, toasts, command palette) |
| Font | Outfit (from Google Fonts) — clean, modern, relaxed |
| Deployment | Vercel |
| PWA | next-pwa or manual manifest.json + service worker |
| CSV Export | Native JS |
| Icons | Lucide React |

---

## Design System — "Dark Mode Mountain"

This app has TWO themes: a primary dark mode ("Mountain Night") and a light mode ("Mountain Day"). The user toggles between them. Dark mode is the default and flagship experience.

### Dark Mode ("Mountain Night")
```
Background:        linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
                   Plus subtle radial glows: green at top-left, blue at bottom-right
Surface:           rgba(255,255,255,0.06) with backdrop-blur-xl
Surface Hover:     rgba(255,255,255,0.10)
Border:            rgba(255,255,255,0.08)
Border Hover:      rgba(255,255,255,0.15)
Text Primary:      #f3f4f6 (off-white)
Text Secondary:    #94a3b8 (slate-400)
Text Muted:        #64748b (slate-500)
Heading:           #ffffff
Accent (Primary):  #84cc16 (Fern Green — matches DO Code Lab logo)
Accent Hover:      #a3e635
Accent Muted:      rgba(132,204,22,0.15)
Accent Glow:       rgba(132,204,22,0.3) — used for box-shadow glows
Danger:            #f87171
Timer Active:      #D97706 (warm amber — pulsing indicator for running timers)
Scrollbar:         rgba(255,255,255,0.1)
```

### Light Mode ("Mountain Day")
```
Background:        linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #ecfdf5 100%)
                   Plus subtle radial glows: softer green, softer blue
Surface:           rgba(255,255,255,0.75) with backdrop-blur-md
Surface Hover:     rgba(255,255,255,0.9)
Border:            rgba(0,0,0,0.06)
Border Hover:      rgba(0,0,0,0.12)
Text Primary:      #374151
Text Secondary:    #6b7280
Heading:           #111827
Accent:            #65a30d (deeper fern for contrast)
Accent Hover:      #84cc16
Timer Active:      #D97706 (same amber)
```

### Design Rules
- **ALL cards/panels use glassmorphism**: semi-transparent background + backdrop-blur-xl + 1px border with low opacity + border-radius: 20px (rounded-2xl or rounded-3xl)
- **NO solid white or solid dark cards** — everything is translucent glass
- **Section headers are "Trail Markers"**: uppercase, letter-spacing: 0.1em, slate color, preceded by ▲ symbol
- **Buttons**: pill-shaped (rounded-full) for primary actions, rounded-xl for secondary
- **Active timers pulse**: green glow animation on running timers, amber accent
- **Progress rings**: circular SVG progress indicators with accent glow/drop-shadow
- **Font**: Outfit for everything (headings and body). Increased line-height (1.6-1.7) for relaxed feel.
- **Floating Island Nav**: On mobile, use a centered pill-shaped bottom navigation bar floating above the bottom edge with glass background and subtle shadow — NOT a full-width tab bar
- **Sidebar**: On desktop, glass sidebar with collapse toggle. Logo uses 道 kanji (meaning "way/path") in a green gradient square
- **CSS custom properties**: Define all theme tokens as CSS variables on `:root` and `[data-theme="dark"]` / `[data-theme="light"]` so theme switching is instant
- **Transitions**: 200ms ease on all interactive state changes. 500ms for theme transitions.
- **No gradients on buttons** unless it's the accent glow effect. Buttons should be solid accent color or outlined.

---

## Database Schema

```sql
-- ============================================
-- CLIENTS (DO Code Lab billing)
-- ============================================
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 70.00,
  color TEXT DEFAULT '#84cc16',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJECTS (linked to clients OR standalone)
-- ============================================
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  category TEXT DEFAULT 'personal' CHECK (category IN ('hapag', 'do_code_lab', 'personal', 'dobot')),
  color TEXT DEFAULT '#84cc16',
  hourly_rate_override DECIMAL(10,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS (linked to projects or standalone)
-- ============================================
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'p3' CHECK (priority IN ('p1', 'p2', 'p3', 'p4')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TIME ENTRIES (the core time tracking data)
-- ============================================
CREATE TABLE time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes TEXT,
  is_manual BOOLEAN DEFAULT FALSE,
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTES (journal, ideas, meeting notes)
-- ============================================
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'daily_journal', 'meeting', 'idea')),
  note_date DATE DEFAULT CURRENT_DATE,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- API KEYS (for DObot access)
-- ============================================
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_start ON time_entries(start_time);
CREATE INDEX idx_time_entries_running ON time_entries(is_running);
CREATE INDEX idx_notes_project ON notes(project_id);
CREATE INDEX idx_notes_date ON notes(note_date);
CREATE INDEX idx_notes_type ON notes(note_type);
```

---

## App Structure & Navigation

### Desktop Layout
```
┌──────────────────────────────────────────────────────┐
│ [Glass Sidebar - 240px, collapsible to 64px]         │
│ ┌──────────┐  ┌────────────────────────────────────┐ │
│ │ 道        │  │ [Glass Top Bar]                    │ │
│ │ In DO Time│  │ 🔍 Search...              ⌘K  [D] │ │
│ │           │  ├────────────────────────────────────┤ │
│ │ ◫ Dashboard│ │                                    │ │
│ │ ⏱ Timers  │  │  [Main Content Area]               │ │
│ │ ◧ Projects │ │                                    │ │
│ │ ☑ Tasks   │  │  Scrollable, padded 28px           │ │
│ │ ◪ Notes   │  │                                    │ │
│ │ 📊 Reports│  │                                    │ │
│ │           │  │                                    │ │
│ │ [Theme ☀️] │ │                                    │ │
│ │ [DObot 🟢]│  │                                    │ │
│ └──────────┘  └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌────────────────────┐
│ [Glass Top Bar]    │
│ In DO Time    [D]  │
├────────────────────┤
│                    │
│ [Main Content]     │
│ Full width, 16px   │
│ padding            │
│                    │
│                    │
│                    │
├────────────────────┤
│  [Floating Island] │
│  ◫  ⏱  ◧  ☑  ◪   │
│  Pill-shaped, glass│
│  Centered, floating│
└────────────────────┘
```

### Pages / Routes
```
/                    → Dashboard (home)
/timers              → Multi-timer dashboard
/projects            → Project list + detail views
/projects/[id]       → Project detail (tasks, time entries, notes)
/tasks               → Task list + kanban toggle
/notes               → Notes feed + journal
/reports             → Time reports + CSV export
/settings            → Theme toggle, DObot API key management
/api/tasks           → DObot API: tasks (GET, query params)
/api/tasks/today     → DObot API: today's prioritized tasks
/api/projects        → DObot API: all projects with status
/api/projects/[id]   → DObot API: project detail
/api/notes           → DObot API: recent notes
/api/dashboard       → DObot API: summary object
/api/time            → DObot API: time tracking summary
```

---

## Feature Specifications

### 1. Dashboard (Home Page — `/`)

The dashboard is the command center. It shows everything at a glance.

**Layout:**
- Greeting: "Good morning/afternoon/evening, Davis" + date + tasks remaining count
- Row 1: Circular Progress Ring (tasks done today / total) + stats (active projects, due today, overdue, hours tracked today) + Focus Task card (highest priority non-done task with accent glow)
- Row 2: Active Timers strip — horizontal scrollable cards showing any currently running timers with live elapsed time. If no timers running, show "No active timers" with a quick-start button.
- Row 3: Today's Tasks list (sorted by priority, clickable checkboxes)
- Row 4: Two-column grid — Daily Journal entry (left) + Active Projects summary (right)

**Circular Progress Ring:**
- SVG-based, 88-120px diameter
- Track: theme progressTrack color
- Progress: accent color with `filter: drop-shadow(0 0 6px accentGlow)`
- Center: done count (large, bold, accent) + "Done" label (tiny, muted, uppercase)
- Animate on mount with CSS transition on stroke-dashoffset

**Active Timer Strip:**
- Horizontal scroll on mobile, flex-wrap on desktop
- Each timer card: glass card with project name, client name, live HH:MM:SS counter, running cost ($), and stop/pause buttons
- Running timers have a pulsing green border animation
- Uses `setInterval` with 1-second tick, but actual duration calculated from `start_time` in DB (not client-side accumulation) to prevent drift

### 2. Timers Page (`/timers`)

This is the core time tracking interface from the original In DO Time design.

**Multi-Timer Dashboard:**
- Card grid showing all active client projects with timer controls
- Each card: glass card with client color accent stripe at top, project name, client name, timer display (HH:MM:SS), running cost, and controls
- Controls: Play ▶ / Pause ⏸ / Stop ⏹ buttons (pill-shaped, icon-based)
- **Multiple timers CAN run simultaneously** (key requirement)
- Timer state persists in Supabase `time_entries` table with `is_running = true`
- When timer stops: `end_time` and `duration_seconds` are calculated and saved
- When timer starts: new `time_entries` row created with `start_time = NOW()` and `is_running = true`
- Pause creates a new entry when resumed (entries represent continuous blocks)

**Quick Start:**
- "+" button opens a modal to select project (grouped by client) and optionally link a task
- Recently used projects shown at top for quick access

**Timer Persistence:**
- On page load, check for any `time_entries` where `is_running = true`
- Resume displaying those timers with correct elapsed time calculated from `start_time`
- This means closing the browser and reopening shows the correct running time

**Manual Entry:**
- Allow adding time entries manually (date, start time, end time, project, notes)
- Flagged as `is_manual = true` in the database

**Today's Summary:**
- Total hours tracked today across all projects
- Displayed as a hero element with the circular progress ring
- Breakdown by project underneath

### 3. Projects Page (`/projects`)

**Project List:**
- Grid of glass cards (2 columns desktop, 1 column mobile)
- Each card: colored dot (category), project name, client name (if linked), description, progress bar (tasks done/total), "X open" count
- Filter pills at top: All, Hapag-Lloyd, DO Code Lab, Personal, DObot
- Category colors: Hapag=#38bdf8, DO Code Lab=#84cc16, Personal=#c084fc, DObot=#fb923c
- Hover: border shifts to accent, subtle lift with shadow
- Click: navigates to project detail page

**Project Detail Page (`/projects/[id]`):**
- Header: project name, client, category badge, status, edit button
- Tabs or sections: Tasks | Time Entries | Notes
- Tasks: filtered task list for this project with add/edit/complete
- Time Entries: chronological list of time tracked, with totals
- Notes: project-linked notes

**Project CRUD:**
- Create/edit modal: name, description, client (dropdown), category, status, color, hourly rate override
- Archive (soft delete via status change)

### 4. Tasks Page (`/tasks`)

**Two Views (toggle in header):**

**List View:**
- Filter pills: All, To Do, In Progress, Done
- Each row: checkbox, priority badge (P1-P4 with color), title, project name, due date
- Click checkbox toggles status (todo ↔ done)
- Click row opens detail/edit
- Sorted: in_progress first, then todo by priority, then done
- Overdue dates in red, today dates in accent green

**Kanban View (desktop only):**
- Three columns: To Do | In Progress | Done
- Glass background columns with rounded corners
- Cards are draggable between columns (HTML5 drag and drop)
- Each card: priority badge, title (max 3 lines), project tag, due date
- Column headers: icon + title + count badge
- Drop zones highlight with accent dashed border
- Cards sorted by priority within each column

**Task CRUD:**
- Create/edit modal: title, description, project (dropdown), priority (P1-P4), status, due date
- Quick-add from dashboard: title + project + priority only

### 5. Notes Page (`/notes`)

**Feed View:**
- Chronological list of notes, pinned first
- Each note: glass card with type icon (📓 Journal, 💡 Idea, 📋 Meeting, 📝 Note), type badge, project badge (if linked), pinned indicator, date, title (if present), content preview (max 200 chars)
- Pinned notes have accent left border
- Click to expand/edit

**Daily Journal:**
- Auto-prompt on first visit each day: "Start today's journal?"
- Template: "What I worked on / What's next / Blockers"
- Displayed prominently on dashboard

**Note CRUD:**
- Create/edit: title (optional), content (markdown-rendered), type, project link, date, pinned toggle
- Content stored as plain text/markdown, rendered with basic markdown (bold, lists, line breaks)

### 6. Reports Page (`/reports`)

**Time Reports:**
- Date range picker (preset: This Week, Last Week, This Month, Last Month, Custom)
- Filter by: Client, Project, or All
- Summary cards: Total Hours, Total Billable Amount, Average Hours/Day
- Table: Date | Project | Client | Duration | Rate | Amount | Notes
- Trail Marker date headers (uppercase, tracked-out, grouped by day)
- Zebra striping on rows (alternating 5% opacity background tint)

**CSV Export:**
- Button: "Export CSV" — generates and downloads CSV with columns: Date, Client, Project, Start Time, End Time, Duration (hours), Rate, Amount, Notes
- Filename: `in-do-time-report-{startDate}-to-{endDate}.csv`

**Visual Summary:**
- Bar chart or simple visual showing hours per project for the selected period (optional, nice-to-have)

### 7. DObot API Layer (Read-Only)

All endpoints under `/api/` secured with API key in `Authorization: Bearer <key>` header.

**Middleware:**
- Check `Authorization` header against hashed keys in `api_keys` table
- Update `last_used_at` on successful auth
- Return 401 if invalid
- Rate limit: 60 requests per minute

**Endpoints:**

```
GET /api/tasks
  Query params: status, priority, project_id, due_date
  Returns: Array of tasks with project name included

GET /api/tasks/today
  Returns: Today's tasks sorted by priority, with project names
  Includes: overdue tasks from previous days

GET /api/projects
  Returns: All projects with status, category, client name, open task count

GET /api/projects/[id]
  Returns: Project detail with recent tasks, recent time entries, recent notes

GET /api/notes
  Query params: project_id, type, limit (default 10)
  Returns: Recent notes

GET /api/dashboard
  Returns: Summary object:
  {
    tasks_today: { total, completed, overdue },
    active_projects: count,
    hours_today: decimal,
    hours_this_week: decimal,
    active_timers: [{ project_name, elapsed_seconds }],
    focus_task: { title, priority, project_name, due_date }
  }

GET /api/time
  Query params: start_date, end_date, project_id, client_id
  Returns: Time entries with calculated totals
```

**Response Format:**
- All responses wrapped in `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Include `generated_at` timestamp
- Field names are descriptive (not abbreviated) for LLM consumption
- Include `summary` string field where helpful (e.g., "You have 5 tasks due today, 2 overdue")

### 8. Settings Page (`/settings`)

- **Theme Toggle**: Light/Dark mode switch (also accessible from sidebar)
- **DObot API Keys**: List active keys, create new key (show once), revoke keys
- **Profile**: Name, email (for magic link auth)
- **Data**: Export all data as JSON (future)

---

## PWA Configuration

```json
{
  "name": "In DO Time",
  "short_name": "In DO Time",
  "description": "Personal command center & time tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#84cc16",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- Generate icons: green gradient square with 道 kanji, matching the sidebar logo
- Basic service worker for app shell caching (NOT offline-first for MVP)
- `<meta name="apple-mobile-web-app-capable" content="yes">`

---

## Build Order (Suggested Phases)

### Phase 1: Foundation (Iterations 1-10)
- [x] 1. Scaffold Next.js project with App Router, TailwindCSS, Outfit font
- [x] 2. Set up Supabase client, environment variables, database schema migration
- [x] 3. Implement Supabase magic link auth (login page, session management)
- [x] 4. Build the theme system: CSS custom properties, dark/light toggle, persist in localStorage
- [x] 5. Create the app shell: glass sidebar (collapsible), top bar with search placeholder, mobile floating island nav
- [x] 6. Build the theme toggle button in sidebar

### Phase 2: Core Data (Iterations 11-20)
- [x] 7. Client CRUD (add, edit, archive) — modal-based forms
- [x] 8. Project CRUD with client linking and category assignment
- [x] 9. Task CRUD with project linking, priority, status, due dates
- [x] 10. Task list view with filters and sorting
- [x] 11. Task kanban view with drag-and-drop
- [x] 12. Note CRUD with type selection, project linking, markdown rendering

### Phase 3: Timer Engine (Iterations 21-30)
- [x] 13. Time entry data model and server actions (start, stop, pause, manual add)
- [x] 14. Multi-timer dashboard UI with live ticking counters
- [x] 15. Timer persistence (check for running timers on page load, resume display)
- [x] 16. Timer controls (play/pause/stop) with optimistic UI updates
- [x] 17. Today's time summary with circular progress ring
- [x] 18. Manual time entry form

### Phase 4: Dashboard & Reports (Iterations 31-40)
- [x] 19. Dashboard: greeting, stats row with progress ring, focus task card
- [x] 20. Dashboard: active timers strip, today's tasks list
- [x] 21. Dashboard: journal preview + active projects grid
- [x] 22. Reports page: date range picker, client/project filters
- [x] 23. Reports: time entry table with trail marker date headers and zebra striping
- [x] 24. CSV export functionality

### Phase 5: API & Polish (Iterations 41-50)
- [x] 25. DObot API middleware (API key auth, rate limiting)
- [x] 26. API endpoints: /api/tasks, /api/tasks/today, /api/projects, /api/dashboard, /api/time
- [x] 27. PWA manifest, icons, service worker registration
- [x] 28. Mobile responsive polish (floating island nav, card layouts, touch targets)
- [ ] 29. Edge cases: empty states, loading skeletons, error handling, toast notifications
- [ ] 30. Final testing, deploy to Vercel

---

## Explicitly NOT Building

- User roles / multi-user auth (single user only)
- Client portal (clients viewing their own hours)
- Automated invoicing / payment links
- PDF invoice generation (CSV is sufficient for MVP)
- Calendar view / calendar integrations
- Recurring tasks
- File attachments
- Push notifications
- Offline-first mode (basic PWA shell caching only)
- Keyboard shortcuts / command palette (search bar is placeholder only)
- DObot write access (read-only API for v1)
- Real-time collaboration
- Tags / categories beyond the existing category system

---

## Success Criteria

- [ ] Can start/stop/pause multiple timers simultaneously
- [ ] Timers persist across browser sessions (Supabase-backed, no drift)
- [ ] Can add clients with hourly rates ($70/hr default)
- [ ] Can add projects under clients or standalone with categories
- [ ] Time entries auto-log when timer stops
- [ ] Can create, edit, complete tasks with priorities and due dates
- [ ] Kanban drag-and-drop works on desktop
- [ ] Can write daily journal entries and project notes
- [ ] Can view time reports filtered by client + date range
- [ ] Can export CSV time report
- [ ] DObot can query /api/dashboard and get a valid JSON response
- [ ] Dark mode and light mode both look polished
- [ ] Mobile experience works smoothly (floating island nav, responsive cards)
- [ ] Deployed to Vercel as installable PWA
- [ ] Dashboard loads in under 2 seconds

---

## Brand Reference

- **Logo**: Existing In DO Time logo in /public folder. Do NOT generate a new logo — use what's there.
- **App Name**: "In DO Time" — displayed in sidebar with "DEDICATED OPERATIONS" subtitle in uppercase tracked-out muted text
- **Color Categories**: Hapag-Lloyd = sky blue (#38bdf8), DO Code Lab = fern green (#84cc16), Personal = purple (#c084fc), DObot = orange (#fb923c)
- **Priority Colors**: P1 = red (#f87171), P2 = orange (#fb923c), P3 = yellow (#fbbf24), P4 = slate (#94a3b8)
- **Timer Active**: Amber (#D97706) pulsing glow
- **Trail Markers**: Section headers styled as `▲ SECTION NAME` in uppercase, 0.1em letter-spacing, muted slate color

---

## Key Technical Notes

- Use Server Actions for all mutations (create, update, delete) — not API routes
- API routes (`/api/*`) are exclusively for DObot external access
- Timer ticking: use `setInterval` for display, but always calculate elapsed from `start_time` in DB to prevent drift
- Theme: store preference in `localStorage`, apply via `data-theme` attribute on `<html>`, use CSS custom properties
- Supabase client: create a shared utility (`lib/supabase.ts`) for both server and client usage
- All dates stored as UTC in Supabase, displayed in user's local timezone
- Use optimistic updates for task status toggles and timer start/stop for snappy UX
- Kanban drag-and-drop: HTML5 native drag events, update task status via server action on drop

---

## File Structure (Suggested)

```
src/
├── app/
│   ├── layout.tsx          (root layout with theme provider, sidebar, fonts)
│   ├── page.tsx            (dashboard)
│   ├── timers/page.tsx
│   ├── projects/page.tsx
│   ├── projects/[id]/page.tsx
│   ├── tasks/page.tsx
│   ├── notes/page.tsx
│   ├── reports/page.tsx
│   ├── settings/page.tsx
│   ├── login/page.tsx
│   └── api/
│       ├── tasks/route.ts
│       ├── tasks/today/route.ts
│       ├── projects/route.ts
│       ├── projects/[id]/route.ts
│       ├── notes/route.ts
│       ├── dashboard/route.ts
│       └── time/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── MobileNav.tsx      (floating island)
│   │   └── ThemeToggle.tsx
│   ├── dashboard/
│   │   ├── ProgressRing.tsx
│   │   ├── FocusTask.tsx
│   │   ├── ActiveTimers.tsx
│   │   └── StatsRow.tsx
│   ├── timers/
│   │   ├── TimerCard.tsx
│   │   ├── TimerControls.tsx
│   │   └── ManualEntryForm.tsx
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskRow.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   └── KanbanCard.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   └── ProjectForm.tsx
│   ├── notes/
│   │   ├── NoteCard.tsx
│   │   └── NoteForm.tsx
│   ├── reports/
│   │   ├── TimeTable.tsx
│   │   └── DateRangePicker.tsx
│   └── ui/
│       ├── Glass.tsx          (reusable glass card wrapper)
│       ├── Pill.tsx           (badge/pill component)
│       ├── Modal.tsx
│       └── Toast.tsx
├── lib/
│   ├── supabase.ts           (client setup)
│   ├── supabase-server.ts    (server client)
│   ├── theme.ts              (theme context/provider)
│   ├── utils.ts              (formatDate, formatDuration, formatCurrency)
│   └── api-auth.ts           (API key validation middleware)
├── actions/
│   ├── clients.ts
│   ├── projects.ts
│   ├── tasks.ts
│   ├── time-entries.ts
│   └── notes.ts
└── types/
    └── index.ts              (TypeScript interfaces for all models)
```

---

## Seed Data (for development)

After building, seed these so the app looks populated:

**Clients:**
- B.B. (GA Gymnastics State Meets) — $70/hr
- Mariah (Evermore Equine) — $70/hr

**Projects:**
- Case Tracker (category: hapag, no client)
- DObot (category: dobot, no client)
- In DO Time (category: personal, no client)
- GA Gymnastics Site (category: do_code_lab, client: B.B.)
- Evermore Equine Site (category: do_code_lab, client: Mariah)
- Mom's 60th (category: personal, no client)

**Tasks:** ~10-15 tasks spread across projects with mixed statuses and priorities

**Notes:** 2-3 sample notes including a daily journal entry

---

Now build it. Start with Phase 1 (foundation, theme system, app shell) and work through methodically. Make it beautiful. Make it functional. Ship it.
