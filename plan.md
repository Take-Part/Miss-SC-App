# Miss South Carolina CY26 — Take Part Co Crew App (V1) — Development Plan (Updated)

## 1) Objectives
- Build a **mobile-first, on-site crew web app** where **all factual content is loaded verbatim from `data.js`/`data.ts`** (no edits, no reordering, no rephrasing).
- Deliver the **headline feature**: **Supabase Postgres + Realtime** shared deliverable/social **4-state status** that syncs across clients in ~1s with no refresh.
- Add requested production features:
  1. **Fancier jewel-tone navigation** with distinct color separation (desktop + mobile hamburger panel).
  2. **Master Schedule defaults to the actual current date** (in the context of the 2026 event).
  3. **Editable deliverable details** (title, description, location, due text, example links) stored in Supabase and shared via Realtime.
  4. **Delivered flow**: “Delivered” → confirm “Are you sure?” → if yes, prompt for an editable/clickable **delivery link**.
- Ensure **graceful degradation** when Supabase is missing/unreachable: static content still works; no white-screen.
- Keep `/app/backend` ignored (not deployed). App is **Next.js + Supabase direct**.
- Remain **Vercel build-safe** under **TypeScript strict** (must pass `npx tsc --noEmit`).

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

**Status:** Complete (core realtime status syncing working).

---

### Phase 2 — V1 App Development (Next.js UI built around proven core)
**User stories (V1)**
1. As a crew member, I land on **Today** by default and see the correct event day selected.
2. As a crew member, I can swipe/tap days and the day strip centers the selected day chip.
3. As a crew member, I can find what I need fast using search/filtering without changing the underlying data.
4. As a crew member, I can update a deliverable/social status and see teammates’ updates live.
5. As a crew member, I can call key contacts and open map links with one tap.

**Steps**
- Convert CRA frontend to Next.js App Router + TS + Tailwind:
  - Ensure supervisor `yarn start` runs `next dev -p 3000 -H 0.0.0.0`.
  - Ensure also works with `npm run dev` and builds on Vercel.
- Data migration (sacred):
  - Convert `data.js` → `src/lib/data.ts` with types/interfaces **without altering values**.
- App shell + navigation (7 tabs):
  - Persistent masthead + Brand Elements button.
  - Responsive navigation:
    - Desktop: horizontal tab bar
    - Mobile: jewel-tone slide-down hamburger menu
- Tab implementations (verbatim rendering rules):
  - Today / Schedule / Deliverables / Interviews / Delegates / Titleholders / Contacts + Map.
- Supabase integration into Deliverables tab:
  - Missing row = `not_started`.
  - 4-state segmented control + optimistic writes + last-write-wins.
  - Relative updated time + error banner.

**Updates implemented (requested during session):**
- ✅ Jewel-tone navigation redesign completed.
- ✅ Schedule default-date bug fixed so Master Schedule defaults to the correct current date within the 2026 event window.
- ✅ Frontend feature work completed for:
  - Editable deliverable details
  - Delivered confirm → delivery link capture flow

**Frontend implementation details (important):**
- The code uses these Supabase column names (not `*_override`):
  - `title` (text)
  - `notes` (text)
  - `loc` (text)
  - `due` (text)
  - `links` (jsonb)
  - `delivered_link` (text)

**Phase 2 testing (end-to-end)**
- ✅ `npx tsc --noEmit` passes (Vercel build-safe).
- ✅ Visual verification complete via screenshots:
  - Deliverables list rendering
  - Edit dialog rendering (all fields)
  - Delivered confirmation dialog
  - Delivery link input dialog
- ⛔ Backend persistence test for edits + delivery link is blocked until database migration is applied.

---

### Phase 3 — Hardening + Production Readiness
**User stories (hardening)**
1. As a crew member, I can use the app when Supabase is down (status becomes read-only) without losing access to schedules.
2. As a crew member, I can quickly share the crew app link and get a “Copied” confirmation.
3. As a crew member, I can follow Add-to-Home-Screen instructions for iOS/Android.
4. As a producer, I can deploy to Vercel with only env vars and no code changes.
5. As the team, we can confidently update only `data.ts` for future years without breaking the UI.

**Steps**
- Footer + share/install UX:
  - Share link: prefer live `window.location.href`, fallback `APP_URL`.
  - Add to Home Screen instructions.
- Reliability:
  - Central Supabase client + connection health state.
  - Retry/backoff for initial fetch; subscription reconnect handling.
  - Ensure no runtime crash when env vars missing.
- Documentation:
  - README with env vars and exact Supabase SQL.

**Phase 3 testing**
- Test with env vars missing.
- Test with Supabase reachable/unreachable.
- Re-test Realtime sync + persistence across reload.

---

## 3) Next Actions
1. **User runs Supabase migration SQL** to add missing columns to `public.deliverable_status`:
   - File created: `/app/frontend/supabase/migrations/0002_deliverable_overrides.sql`
   - Missing columns confirmed by probe:
     - `title`, `notes`, `loc`, `due`, `links` (jsonb), `delivered_link`
2. After user confirms migration ran successfully:
   - Run an end-to-end test:
     - Edit title/notes/loc/due/links → verify save persists after reload
     - Mark Delivered → confirm → add delivery link → verify clickable link renders on card
     - Verify Realtime sync in a second browser/device
3. User deploys to Vercel (env vars only). Recommended pre-deploy check:
   - `cd /app/frontend && npx tsc --noEmit` (already verified) and `npm run build` if desired.

---

## 4) Success Criteria
- **Data integrity:** all values from `data.ts` appear **exactly** (verbatim) in the correct sections; no invented content.
- **Realtime:** changing any deliverable/social status in Browser A updates Browser B within ~1s (no refresh).
- **Persistence:** statuses + edits + delivery links remain after reload (stored in Supabase).
- **Delivered flow:** Delivered → confirm → link capture works; link is editable and clickable.
- **Graceful degradation:** without Supabase or when unreachable, app still fully works for static content; no crashes.
- **UX requirements met:** jewel-tone nav, schedule date defaulting, deliverable editability, and delivered-link flow.
- **Deploy-ready:** Vercel build passes under TS strict; deploy works by setting env vars only; no secrets in code.
