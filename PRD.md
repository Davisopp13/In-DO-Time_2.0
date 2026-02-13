# In DO Time 2.0 — Flow Optimization PRD

## Overview
**App:** In DO Time — Productivity/task management app
**Stack:** React, Next.js (App Router), Supabase, Tailwind CSS, shadcn/ui, Zustand
**URL:** https://in-do-time.vercel.app/
**Goal:** Fix mobile responsiveness, implement sync system, add smart task parsing, resolve UI overlap issues, integrate with DObot.

## Core User Loop
1. User opens app on any device → sees current tasks synced in real-time
2. User quick-adds tasks via FAB with natural language parsing (`Fix bug @backend tomorrow !!`)
3. Tasks sync across web app and DObot (Telegram) automatically

## Design System
- Follow existing dark/light mode theme
- shadcn/ui components only — no additional UI libraries
- 8px spacing grid (8, 16, 24, 32, 48, 64px)
- Minimum 44px × 44px touch targets
- WCAG AA color contrast
- Subtle shadows: `0 1px 3px rgba(0,0,0,0.1)` for cards
- Border radius: 6-8px buttons/inputs, 8-12px cards, 12-16px modals

## Z-Index Hierarchy
Store in `lib/constants.ts` — import everywhere, no magic numbers.
```
base: 0, dropdown: 10, sticky: 20, sidebar: 25, header: 30,
fab: 35, overlay: 40, drawer: 45, modal: 50, dropdown_portal: 50,
popover: 60, toast: 70, tooltip: 80
```

## Explicitly NOT Building
- No auth refactoring (already configured)
- No route structure changes
- No pull-to-refresh
- No voice message support
- No auto-project detection AI
- No onboarding wizard (future)
- No PWA icon generation (future)

## Constraints
- Preserve all existing functionality
- Match existing code patterns — read existing files before creating new ones
- Use existing Zustand stores — don't create parallel state
- Only schema change: `ALTER TABLE projects ADD COLUMN aliases TEXT[];`
- Install only: `idb` (for offline queue) and `date-fns` (if not present)

---

## Phase 1: Critical UI Fixes (Tasks 1-6)

- [x] **Task 1:** Create `lib/constants.ts` with the z-index hierarchy defined above. Export as `Z_INDEX` object.
- [x] **Task 2:** Create `hooks/useMediaQuery.ts` — accepts a media query string, returns boolean using `window.matchMedia`. Handle SSR (return false on server).
- [x] **Task 3:** Refactor `WorkspaceSwitcher` for mobile — when viewport ≤768px, render as shadcn `Sheet` (side="bottom", ~70vh height, rounded-t-2xl). Show workspace list with: avatar circle (first letter), name, task count. Active workspace gets checkmark + primary bg. Include "Create New Workspace" button at bottom with separator. Use existing workspace data/switching logic unchanged.
- [x] **Task 4:** Refactor `WorkspaceSwitcher` for desktop — use `DropdownMenu` with `DropdownMenuPortal`. min-w-[320px], max-h-[400px] overflow-y-auto. z-index from constants (dropdown_portal: 50).
- [x] **Task 5:** Search entire codebase for hardcoded z-index values and replace with imports from `lib/constants.ts`.
- [x] **Task 6:** Add viewport meta to `app/layout.tsx`: `viewport-fit=cover`, `maximum-scale=1`. Add safe area CSS custom properties to `globals.css` using `env(safe-area-inset-*)`. Update Layout: header padding-top with safe-area-top, bottom nav padding-bottom with safe-area-bottom.

## Phase 2: Smart Parsing Foundation (Tasks 7-11)

- [x] **Task 7:** Create `utils/parseTaskInput.ts`. Export `ParsedTask` interface (`title`, `due_date`, `priority`, `project`, `tags`, `assignee`) and `parseTaskInput(input, context?)` function. Parse in this order, removing matched text from title each time: (1) Project: `@name` or `/tasks@name` → look up in context.projectAliases, (2) Tags: `#tagname` → collect all, (3) Dates: "tomorrow"/"today"/"next week"/"in N days"/"MM/DD"/weekday names → resolve to Date, (4) Priority: `!!!`/`urgent`/`asap` → high, `!!`/`important` → high, `!` → medium, `low priority` → low, (5) Assignee: `+username`. Final title: collapse spaces, trim.
- [x] **Task 8:** Write tests for `parseTaskInput` — cover: plain task, all features combined (`"Fix bug @backend tomorrow !! #urgent +davis"`), multiple tags, each date variant, project alias resolution, edge cases (empty string, only modifiers, extra spaces).
- [ ] **Task 9:** Run Supabase migration: `ALTER TABLE projects ADD COLUMN aliases TEXT[];`
- [ ] **Task 10:** Create `hooks/useProjectAliases.ts` — reads projects from workspace Zustand store, builds `Record<string, projectId>` map including: lowercased project name, each alias from `project.aliases` array, auto-generated acronym (first letter of each word, lowercased, only if >1 char).
- [ ] **Task 11:** Verify parseTaskInput + useProjectAliases work together — create a small integration test or manual verification.

## Phase 3: Quick Add UI (Tasks 12-15)

- [ ] **Task 12:** Create `components/FAB.tsx` — fixed bottom-20 right-4, z-index `Z_INDEX.fab` (35), 56px circle, primary bg, Plus icon (lucide-react), hover:scale-110 transition, aria-label="Add task".
- [ ] **Task 13:** Create `components/QuickAddTask.tsx` — shadcn Dialog. Contains: autofocus text input (placeholder "What needs to be done?"), syntax hint text below. Live parsing preview panel (visible when input non-empty): shows parsed title, Badge components for project (Folder icon), due_date (Calendar icon + formatted date), priority (Flag icon, destructive variant if high), tags (outline badges with #), assignee (User icon). Form submit creates task via existing creation logic, clears input, closes dialog.
- [ ] **Task 14:** Add global keyboard shortcut — `Cmd+K` / `Ctrl+K` opens QuickAddTask dialog. Use useEffect with keydown listener. Prevent default browser behavior.
- [ ] **Task 15:** Wire FAB into main layout — renders on all authenticated pages, click opens QuickAddTask. Test on mobile: FAB doesn't overlap bottom nav, dialog input isn't obscured by keyboard.

## Phase 4: Sync System (Tasks 16-23)

- [ ] **Task 16:** Create `hooks/useOnlineStatus.ts` — track `navigator.onLine`, listen to window `online`/`offline` events, return boolean. Handle SSR.
- [ ] **Task 17:** Create `hooks/useSync.ts` — manages sync state: `status` ('synced' | 'syncing' | 'offline' | 'error'), `lastSynced` (Date | null). Auto-sync on window `focus` event. Auto-sync every 45 seconds when online. Expose: `syncNow()`, `status`, `lastSynced`, `pendingChanges` (count from offline queue), `isOnline`.
- [ ] **Task 18:** Create `hooks/useRealtimeSync.ts` — subscribe to Supabase `postgres_changes` on `tasks` table filtered by `workspace_id`. Handle INSERT → add to Zustand store, UPDATE → update in store, DELETE → remove from store. Clean up channel on unmount or workspace change.
- [ ] **Task 19:** Install `idb` package: `npm install idb`.
- [ ] **Task 20:** Create `hooks/useOfflineQueue.ts` — open IndexedDB database `InDoTimeQueue` with object store `queue` (keyPath: `id`). `addToQueue(item)`: stores mutation with `id`, `action`, `table`, `data`, `timestamp`. `flushQueue()`: processes all items in order, removes successful ones, retries failed. Auto-flush triggered by `online` event from useOnlineStatus.
- [ ] **Task 21:** Create `hooks/useOptimisticTask.ts` — `createTask`: add to Zustand with temp ID immediately, insert into Supabase, on success replace temp ID with real ID, on failure add to offline queue. Same pattern for `updateTask` and `deleteTask`. Last-write-wins for conflicts.
- [ ] **Task 22:** Create `components/SyncStatus.tsx` — compact header indicator. Synced: green Check icon. Syncing: blue RefreshCw with animate-spin. Offline: gray CloudOff + pending count text. Error: red AlertCircle. Add this component to the app header.
- [ ] **Task 23:** Update `QuickAddTask` component to use `useOptimisticTask` for task creation instead of direct Supabase calls.

## Phase 5: Performance & Accessibility (Tasks 24-30)

- [ ] **Task 24:** Wrap stat cards and other pure display components in `React.memo`. Add `useMemo` for stat calculations (active count, due today, overdue) derived from task arrays.
- [ ] **Task 25:** Add `useCallback` for event handlers passed as props to child components. Review Zustand usage — ensure components use granular selectors (e.g., `useTaskStore(s => s.tasks)` not `useTaskStore()`).
- [ ] **Task 26:** Create skeleton loading components: `components/skeletons/TaskListSkeleton.tsx`, `components/skeletons/DashboardSkeleton.tsx`. Match the layout dimensions of their real counterparts. Use `animate-pulse` on gray placeholder blocks.
- [ ] **Task 27:** Add error boundaries with retry buttons around main content areas (task list, dashboard). Create a reusable `components/ErrorBoundary.tsx`.
- [ ] **Task 28:** Audit all buttons and interactive elements — ensure minimum 44×44px touch targets. Fix any that are smaller by adding padding or min-h/min-w classes.
- [ ] **Task 29:** Add `aria-label` to all icon-only buttons (FAB, sync status, workspace switcher trigger, etc.). Ensure all modals trap focus and return focus to trigger on close.
- [ ] **Task 30:** Increase stat card vertical spacing from 16px to 20px. Upgrade card shadows from `shadow-sm` to `shadow-md`. Final visual consistency check across all new components.

---

## Verification (run after all tasks complete)

**Sync:**
- Create task on one tab → appears in another tab via real-time
- Toggle offline in DevTools → create task → go online → task syncs
- 45-second auto-sync interval fires correctly
- SyncStatus indicator reflects correct state

**Smart Parsing:**
- `"Fix bug @backend tomorrow !! #urgent +davis"` → title "Fix bug", project backend, due tomorrow, high priority, tag urgent, assignee davis
- `"Design review #ui #ux"` → title "Design review", tags [ui, ux]
- `"Call client Friday"` → title "Call client", due next Friday
- Empty input → empty title, all nulls
- Live preview badges update as user types

**Mobile:**
- Workspace switcher renders as bottom Sheet on mobile (no overlap)
- FAB floats above bottom nav
- Quick Add dialog works with mobile keyboard visible
- Safe areas respected on iOS (no content behind notch/home indicator)
- All touch targets ≥ 44px

## File Structure (new files only)
```
lib/constants.ts                    # Z-index hierarchy
hooks/useMediaQuery.ts              # Responsive breakpoint hook
hooks/useProjectAliases.ts          # Project alias map builder
hooks/useOnlineStatus.ts            # Online/offline detection
hooks/useSync.ts                    # Sync orchestrator
hooks/useRealtimeSync.ts            # Supabase real-time subscriptions
hooks/useOfflineQueue.ts            # IndexedDB mutation queue
hooks/useOptimisticTask.ts          # Optimistic UI updates
utils/parseTaskInput.ts             # Natural language task parser
utils/__tests__/parseTaskInput.test.ts  # Parser tests
components/FAB.tsx                  # Floating action button
components/QuickAddTask.tsx         # Quick add modal with live preview
components/SyncStatus.tsx           # Sync indicator for header
components/skeletons/TaskListSkeleton.tsx
components/skeletons/DashboardSkeleton.tsx
components/ErrorBoundary.tsx
```
