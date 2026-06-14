# Miss South Carolina CY26 — Take Part Co Crew App (V1) — Development Plan

## 1) Objectives
- Build a **mobile-first, on-site crew web app** where **all factual content is loaded verbatim from `data.js`** (no edits, no reordering, no rephrasing).
- Deliver the **headline feature**: **Supabase Postgres + Realtime** shared deliverable/social **4-state status** that syncs across clients in ~1s with no refresh.
- Convert `/app/frontend` into a **Next.js (App Router) + TypeScript + Tailwind** app, runnable via `npm run dev` and **`yarn start` on port 3000** in this environment; deploy-ready for **Vercel**.
- Ensure **graceful degradation** when Supabase is missing/unreachable: all static content still works; no white-screen.

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
  - Directions: Supabase Dashboard → Project → **Project Settings → API** → copy **Project URL** + **anon public** key.
- Set up Supabase schema (run in Supabase SQL editor):
  - Create table `deliverable_status` with:
    - `id text primary key`
    - `status text` with check constraint allowing only: `not_started|filming|editing|delivered`
    - `updated_at timestamptz default now()`
    - `updated_by text null`
  - Enable RLS + permissive policies (open read/insert/update; no auth).
  - Enable Realtime on the table (publication for `supabase_realtime`).
- POC code (minimal):
  - Add `@supabase/supabase-js` client init using env vars only.
  - Implement:
    - `fetchAllStatuses()` map by id
    - `upsertStatus(id, status, updated_by)` optimistic
    - `subscribe()` to `postgres_changes` on `deliverable_status` and update local store on payload.
  - Add a **Node/TS script** (or minimal Next.js route/page) to:
    - open a subscription
    - perform an upsert
    - verify subscriber receives payload within ~1s.
- Do not proceed until POC passes in two browsers.

---

### Phase 2 — V1 App Development (Next.js UI built around proven core)
**User stories (V1)**
1. As a crew member, I land on **Today** by default and immediately see Sunday 6/14 selected.
2. As a crew member, I can swipe/tap days and the day strip centers the selected day chip.
3. As a crew member, I can find what I need fast using search/filtering without changing the underlying data.
4. As a crew member, I can update a deliverable/social status and see teammates’ updates live.
5. As a crew member, I can call key contacts and open map links with one tap.

**Steps**
- Convert CRA frontend to Next.js App Router + TS + Tailwind:
  - Replace tooling/scripts so supervisor `yarn start` runs **`next dev -p 3000 -H 0.0.0.0`**.
  - Ensure also works with `npm run dev` (Vercel-ready).
- Data migration (sacred):
  - Convert `data.js` → `src/lib/data.ts` exporting:
    `BRAND_LINK, APP_URL, TITLEHOLDERS, CONTACTS, LOCATIONS, DELIVERABLES, SOCIALS, SCHEDULE, MASTER, MISS, TEEN, INTERVIEWS`.
  - Preserve values **verbatim** including typos, TBDs, ordering, and base64 photos.
  - Add TS types/interfaces **without altering values**.
- App shell + navigation (7 tabs):
  - Persistent masthead with required eyebrow/title/subtitle + **Brand Elements** button to `BRAND_LINK`.
  - Responsive navigation:
    - Desktop: horizontal top tab bar.
    - Mobile: top bar + hamburger → slide-down panel w/ X + backdrop.
  - Default tab: **Today**.
- Tab implementations (verbatim rendering rules):
  - **Today:** swipeable day strip (Sat 6/13 → Sun 6/21), center chip on tap, render timeline rows + tags + maps links + deliverable due chips.
  - **Schedule:** toggle Our shoots (SCHEDULE) vs Master (MASTER), collapsible by day, expand/collapse all, master B-roll-only filter, search across week w/ auto-expand.
  - **Deliverables:** combined list (DELIVERABLES + SOCIALS) with grouping order + filters + Sunday warning banner (verbatim) + status control + “updated Xm ago”.
  - **Interviews:** banner + filter chips All/Miss/Teen + render 5 tables from `INTERVIEWS` only.
  - **Delegates:** toggle Miss/Teen table; WITHDREW rows dim + strike.
  - **Titleholders:** 3 cards using base64 photos + link.
  - **Contacts + Map:** tap-to-call contacts; list LOCATIONS except `tbd` with map links.
- Shared components + UX polish (allowed creativity):
  - Tags, chips, cards, collapsibles, skeletons, empty states, subtle animation.
  - Color tokens per provided palette.
- Supabase integration into Deliverables tab:
  - Local computed default: missing row = `not_started`.
  - Status control: 4-state segmented control + optimistic writes + last-write-wins.
  - Relative updated time for non-default.
  - Error banner/toast when write fails; app continues.

**Phase 2 testing (end-to-end)**
- Run app in preview.
- Validate all tabs render and every data value is present verbatim.
- Validate Deliverables filters/sorts (film.startMin ordering, due vs filming day modes).
- Validate two-browser realtime sync.

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
  - Add to Home Screen instructions (iOS/Android toggle).
  - Placement: mobile in hamburger menu; desktop in footer.
  - Footer fine print (verbatim).
- Reliability:
  - Central Supabase client + connection health state.
  - Retry/backoff for initial fetch; subscription reconnect handling.
  - Ensure no runtime crash when env vars missing.
- Documentation:
  - README with:
    - env vars
    - exact SQL to create table + policies + realtime
    - local dev + Vercel deployment steps.

**Phase 3 testing**
- Test with env vars missing (static app still works).
- Test with Supabase reachable/unreachable.
- Re-test Realtime sync + persistence across reload.

---

## 3) Next Actions
1. I provide exact directions (Supabase dashboard path) and you paste:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. I’ll run the Supabase SQL to create table + RLS policies + enable Realtime.
3. Execute the Phase 1 POC (two clients) until it passes.
4. Build the full Next.js app (Phase 2) around the proven Supabase core.

---

## 4) Success Criteria
- **Data integrity:** all values from `data.js` appear **exactly** (verbatim) in the correct sections; no invented content.
- **Realtime:** changing any deliverable/social status in Browser A updates Browser B within ~1s (no refresh).
- **Persistence:** statuses remain after reload (stored in Supabase).
- **Graceful degradation:** without Supabase or when unreachable, app still fully works for static content; no crashes.
- **UX requirements met:** 7-tab nav behaviors, Today strip centering, Schedule b-roll filter, Deliverables sorting/filtering rules, Interviews tables (no QOL).
- **Deploy-ready:** `npm run dev` works locally; Vercel deploy works by setting env vars only; no secrets in code.
