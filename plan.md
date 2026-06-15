# Miss South Carolina CY26 — Take Part Co Crew App (V1) — Development Plan (Updated)

## 1) Objectives
- Build a **mobile-first, on-site crew web app** where the **baseline factual content** is loaded verbatim from `data.ts`.
- Use **Supabase Postgres + Realtime** so changes sync across all devices in ~1s without refresh.
- Deliver production features:
  1. **Fancier jewel-tone navigation** with distinct color separation (desktop + mobile hamburger panel).
  2. **Master Schedule defaults to the actual current date** (in the context of the 2026 event).
  3. **Editable deliverable details** (title, description/notes, location, due text, example links) stored in Supabase and shared via Realtime.
  4. **Delivered flow**: “Delivered” → confirm “Are you sure?” → if yes, prompt for an editable/clickable **delivery link**.
  5. **Cross-navigation**: from **Today** and **Schedule (Our shoots)**, schedule items that map to deliverables show a **“View in Deliverables”** (or deliverable title) button that jumps to the matching deliverable card and briefly highlights it.
  6. **Full CRUD control** (add/edit/delete-hide/restore), shared crew-wide:
     - **Deliverables**: add new deliverables, edit, **delete via hide (soft-delete)** with confirmation, and **restore hidden items**; optional **purge custom** deliverables.
     - **Schedule** (both “Our shoots” and “Master”): add/edit/delete-hide/restore schedule items and add/remove whole days.
- Ensure **graceful degradation** when Supabase is missing/unreachable: static content still works; no white-screen.
- Keep `/app/backend` ignored (not deployed). App is **Next.js + Supabase direct**.
- Remain **Vercel build-safe** under **TypeScript strict** (`npx tsc --noEmit`).

**Current status (high-level):**
- ✅ Phases 1–2 complete.
- ✅ Phase 3A (Deliverables CRUD) complete and verified.
- ✅ Phase 3B (Schedule CRUD) complete and verified.
- ⏳ Optional: add a DELETE RLS policy for `deliverable_status` so **purge custom deliverables** works everywhere.

---

## 2) Implementation Steps

### Phase 1 — Core POC (Supabase Realtime status sync in isolation)
**Goal:** Prove Realtime + upsert + persistence works before building the full UI.

**User stories (POC)**
1. As a crew member, I can change a deliverable status and see it persist after reload.
2. As a second crew member on another device, I see status changes appear within ~1s without refresh.
3. As a crew member, if Supabase is unreachable, the app still loads and I can continue using schedules/contacts.
4. As a crew member, I can see “updated X minutes ago” for any non-default status.
5. As a producer, I can confirm the exact list of valid IDs is enforced (no typos / no extra IDs).

**Steps**
- Collect Supabase credentials from user:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Set up Supabase schema (run in Supabase SQL editor):
  - Create table `deliverable_status` with:
    - `id text primary key`
    - `status text` with check constraint allowing only: `not_started|filming|editing|delivered`
    - `updated_at timestamptz default now()`
    - `updated_by text null`
  - Enable RLS + permissive policies (open read/insert/update; no auth).
  - Enable Realtime on the table.
- POC code (minimal):
  - Add `@supabase/supabase-js` client init using env vars only.
  - Implement fetch, upsert (optimistic), subscribe to `postgres_changes`.
  - Verify two browsers sync.

**Status:** ✅ Complete.

---

### Phase 2 — V1 App Development (Next.js UI built around proven core)
**User stories (V1)**
1. As a crew member, I land on **Today** by default and see the correct event day selected.
2. As a crew member, I can swipe/tap days and the day strip centers the selected day chip.
3. As a crew member, I can find what I need fast using search/filtering without changing the underlying data.
4. As a crew member, I can update a deliverable/social status and see teammates’ updates live.
5. As a crew member, I can call key contacts and open map links with one tap.
6. As a crew member, while looking at Today/Schedule, I can tap **View in Deliverables** to jump directly to that deliverable’s details/status.

**Steps**
- Convert CRA frontend to Next.js App Router + TS + Tailwind:
  - Ensure supervisor `yarn start` runs `next dev -p 3000 -H 0.0.0.0`.
  - Ensure also works with `npm run dev` and builds on Vercel.
- Data migration (baseline sacred):
  - Convert `data.js` → `src/lib/data.ts` with types/interfaces **without altering values**.
- App shell + navigation (7 tabs):
  - Persistent masthead + Brand Elements button.
  - Responsive navigation:
    - Desktop: horizontal tab bar
    - Mobile: jewel-tone slide-down hamburger menu
- Tab implementations:
  - Today / Schedule / Deliverables / Interviews / Delegates / Titleholders / Contacts + Map.
- Supabase integration into Deliverables tab:
  - Missing row = `not_started`.
  - 4-state segmented control + optimistic writes + last-write-wins.
  - Relative updated time + error banner.
- Deliverable editing + delivery links:
  - Edit modal supports title/notes/location/due/example-links overrides.
  - Delivered flow prompts confirmation, then captures an editable/clickable delivery link.
- Cross-navigation (Today/Schedule → Deliverables):
  - Schedule items with `deliv: string[]` show a button that jumps to the deliverable card in Deliverables.
  - When opened via jump, DeliverablesTab scrolls to the card and applies a short highlight pulse.

**Updates implemented (requested during session):**
- ✅ Jewel-tone navigation redesign completed.
- ✅ Schedule default-date bug fixed so Master Schedule defaults to the correct current date within the 2026 event window.
- ✅ Editable deliverable details + Delivered confirmation/link flow implemented.
- ✅ Cross-navigation implemented (Today + Schedule Our shoots → Deliverables, with scroll + highlight).

**Frontend implementation details (important):**
- Supabase column names used by deliverable overrides:
  - `title` (text)
  - `notes` (text)
  - `loc` (text)
  - `due` (text)
  - `links` (jsonb)
  - `delivered_link` (text)
- Cross-navigation implementation details:
  - `data.ts`: helper `findDeliverableMeta(id)` resolves IDs across **DELIVERABLES** and **SOCIALS**.
  - `primitives.tsx`: `<DeliverableLink />` UI primitive.
  - `CrewApp.tsx`: lifted state + `openDeliverable(id)` changes active tab and sets focus.
  - `DeliverablesTab.tsx`: `focusId` triggers scroll + highlight (`.card-highlight`) and then clears focus.

**Phase 2 testing (end-to-end)**
- ✅ `npx tsc --noEmit` passes (Vercel build-safe).
- ✅ Supabase migration applied; edits + links persist.
- ✅ Visual verification complete via screenshots + DOM checks.

**Status:** ✅ Complete.

---

### Phase 3 — Full CRUD Control (New requirement)
This phase adds the ability to **add/edit/delete (hide)/restore** both **Deliverables** and **Schedule** content, shared crew-wide via Supabase Realtime.

#### Phase 3A — Deliverables CRUD (add/edit/delete-hide/restore)
**User stories (Deliverables CRUD)**
1. As a producer, I can add a new deliverable (video or social must/nice) from the UI and it appears for the whole crew.
2. As a producer, I can delete a built-in deliverable in a reversible way (hide) with a confirmation step.
3. As a producer, I can restore a hidden deliverable from a “Hidden” manager panel.
4. As a producer, I can permanently purge a custom deliverable (optional, custom-only), with confirmation.
5. As a crew member, I still see realtime status + edits + delivery links for all items.

**Implementation approach**
- Keep `data.ts` as the baseline list.
- Store custom items and hide flags in Supabase (source-of-truth overlay):
  - Built-in items: hide via `hidden=true` (soft-delete, reversible).
  - Custom items: created as rows with `is_custom=true` and metadata (`kind`, `must`, `film`, `due`, etc.).

**Backend / schema changes**
- ✅ Migration `0003_deliverable_crud.sql` applied by user; adds:
  - `hidden boolean default false`
  - `is_custom boolean default false`
  - `kind text` (`video|social`)
  - `must boolean` (social grouping)
  - `film text`
  - `film_days jsonb` (optional string[])
  - `due_day text` (optional)
  - `NOTIFY pgrst, 'reload schema'`

**Frontend implementation (completed)**
- `status.ts`: extended `StatusRow` with `hidden/is_custom/kind/must/film/film_days/due_day`.
- `useStatuses.ts`:
  - `EditableFields` expanded to include new fields.
  - `addDeliverable(payload)` creates `cd_<uuid>` id, optimistic update + upsert.
  - `deleteRow(id)` attempts hard delete (used for purging custom items).
- `DeliverableDialogs.tsx`:
  - `AddDeliverableDialog`
  - `ConfirmDialog`
  - `HiddenDialog`
  - `EditDialog` supports `allowReset` (built-in = reset allowed; custom = literal write, no reset-to-original).
- `DeliverablesTab.tsx`:
  - `rowToUnified()` builds UI cards from custom rows.
  - `useMemo` merges built-in list + custom items, splits hidden into `liveItems` vs `hiddenItems`.
  - UI actions: Add deliverable button, Hidden(n) manager, per-card delete (soft-hide) with confirm, restore, and purge custom.

**Testing / verification**
- ✅ UI verified:
  - Adding a deliverable increments counts and persists.
  - Hide + restore cycle works crew-wide.
- ✅ REST verification:
  - All new fields round-trip correctly.

**Status:** ✅ Complete.

**Optional follow-up (recommended): enable purge for custom deliverables**
- ⏳ Add RLS DELETE policy for `deliverable_status` (needed for purge via anon key):
  ```sql
  DROP POLICY IF EXISTS "deliverable_status delete" ON public.deliverable_status;
  CREATE POLICY "deliverable_status delete" ON public.deliverable_status
    FOR DELETE USING (true);
  ```

---

#### Phase 3B — Schedule CRUD (Our shoots + Master; add/edit/delete-hide/restore + days)
**User stories (Schedule CRUD)**
1. As a producer, I can add a schedule item to any day (Our shoots or Master) and it appears for everyone.
2. As a producer, I can edit any schedule item fields: time, title, location, type, b-roll, crew notes, star tags, sub-notes, and linked deliverable ids.
3. As a producer, I can hide a built-in schedule item (soft-delete) with confirmation and restore it later.
4. As a producer, I can add/remove entire days from the schedule view.

**Data model (implemented)**
- Baseline schedule content remains in `data.ts`.
- Overlays (custom items, edits, hides, custom days, day hides) are stored in Supabase table `schedule_items`.
- Deterministic IDs for built-in schedule items:
  - `${kind}:${date}:${index}` where kind is `shoots|master`.
- Day hiding uses deterministic IDs:
  - `dayhide:${kind}:${date}`.

**Backend / schema changes**
- ✅ Migration `0004_schedule_items.sql` applied by user:
  - Creates `public.schedule_items` with fields covering both schedules and day rows (`is_day=true`).
  - Enables RLS with permissive policies for select/insert/update/delete.
  - Adds the table to `supabase_realtime` publication.
  - `NOTIFY pgrst, 'reload schema'`.

**Frontend implementation (completed)**
- `src/lib/useSchedule.ts`: realtime hook mirroring `useStatuses`.
- `src/components/ScheduleDialogs.tsx`: add/edit item dialog, add day dialog, hidden manager.
- `src/components/tabs/ScheduleTab.tsx`: rewritten to:
  - merge baseline schedule with overlay rows;
  - support add/edit/delete-hide/restore for items;
  - support add/delete-hide/restore for days;
  - keep Search and B-roll filter (Master mode);
  - preserve Deliverables cross-navigation.
- `src/components/CrewApp.tsx`: wires `useSchedule(statuses.initials)` into `ScheduleTab`.
- `src/lib/utils.ts`: `parseTimeMin()` added so custom and merged items sort by time.

**Testing / verification**
- ✅ `npx tsc --noEmit` passes.
- ✅ REST E2E passed (with cleanup):
  - add custom item (+jsonb `deliv`)
  - edit built-in override row
  - hide built-in item
  - add custom day
  - hide built-in day
  - delete policy confirmed + all test rows removed
- ✅ UI verified:
  - add-item flow works; item appears time-sorted with **ADDED** badge.
  - Master schedule mode renders and B-roll filter works.

**Status:** ✅ Complete.

---

### Phase 4 — Hardening + Production Readiness
**User stories (hardening)**
1. As a crew member, I can use the app when Supabase is down (status becomes read-only) without losing access to schedules.
2. As a crew member, I can quickly share the crew app link and get a “Copied” confirmation.
3. As a crew member, I can follow Add-to-Home-Screen instructions for iOS/Android.
4. As a producer, I can deploy to Vercel with only env vars and no code changes.
5. As the team, we can confidently update only `data.ts` for future years without breaking the UI.

**Steps (remaining work)**
- Reliability:
  - Confirm all tabs degrade gracefully when Supabase is unreachable (deliverables and schedule CRUD become read-only but still render baseline `data.ts`).
  - Add reconnect/backoff messaging for schedule as well (similar to deliverables).
- Documentation:
  - Update README with:
    - required env vars
    - SQL migrations: `0002_deliverable_overrides.sql`, `0003_deliverable_crud.sql`, `0004_schedule_items.sql`
    - optional deliverables DELETE policy for purge
- Pre-deploy checks:
  - `cd /app/frontend && npx tsc --noEmit`
  - `cd /app/frontend && npm run build`

**Status:** ⏳ Not started (recommended polishing step).

---

## 3) Next Actions
1. **Optional (recommended): enable purge for custom deliverables** by running the deliverables DELETE policy:
   ```sql
   DROP POLICY IF EXISTS "deliverable_status delete" ON public.deliverable_status;
   CREATE POLICY "deliverable_status delete" ON public.deliverable_status
     FOR DELETE USING (true);
   ```
2. **Hardening (recommended):** verify offline/unconfigured Supabase behavior for both Deliverables and Schedule CRUD.
3. **Pre-deploy check:**
   - `cd /app/frontend && npx tsc --noEmit`
   - `cd /app/frontend && npm run build`
4. **Vercel deploy:** user deploys with only env vars.

---

## 4) Success Criteria
- **Data integrity:** baseline values from `data.ts` appear exactly unless overridden by explicit CRUD edits stored in Supabase overlays.
- **Realtime:** status/content/schedule CRUD changes in Browser A update Browser B within ~1s.
- **Persistence:** statuses + edits + links + custom items + hidden flags remain after reload.
- **Delivered flow:** Delivered → confirm → link capture works; link is editable and clickable.
- **Cross-navigation:** Today/Schedule “View in Deliverables” buttons jump to and highlight the correct card.
- **Deliverables CRUD:** add, hide (soft-delete), restore, and (custom-only) purge all work crew-wide.
- **Schedule CRUD:** add/edit/hide/restore items and days works for both Our shoots and Master.
- **Graceful degradation:** without Supabase or when unreachable, app still fully works for static content; no crashes.
- **Deploy-ready:** Vercel build passes under TS strict; deploy works by setting env vars only; no secrets in code.
