# Miss South Carolina CY26 — Take Part Co Crew App

A mobile-first, on-site run-of-show app for the Take Part Co video crew working
Miss South Carolina CY26 (Competition Week, June 14–21, Columbia SC).

All factual content (schedules, deliverables, interviews, delegates, contacts,
titleholders, locations) is loaded **verbatim** from `src/lib/data.ts` — the
single source of truth. The only live/shared piece is the **production status**
of each deliverable & social cut, backed by **Supabase (Postgres + Realtime)**.

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS**
- **Supabase** (`@supabase/supabase-js`) for the shared 4-state status + Realtime

## Environment variables

Create `.env.local` (locally) or set these in Vercel → Project → Settings →
Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
```

The app **degrades gracefully** without these: every static tab still works; only
the live status control goes read-only/offline.

## Supabase setup (run once in the SQL Editor)

```sql
create table if not exists public.deliverable_status (
  id text primary key,            -- matches the deliverable/social id from data.ts
  status text not null default 'not_started'
    check (status in ('not_started','filming','editing','delivered')),
  updated_at timestamptz not null default now(),
  updated_by text                 -- optional free-text initials/name, nullable
);

alter table public.deliverable_status enable row level security;

drop policy if exists "anyone can read"  on public.deliverable_status;
create policy "anyone can read"  on public.deliverable_status for select using (true);

drop policy if exists "anyone can write" on public.deliverable_status;
create policy "anyone can write" on public.deliverable_status for insert with check (true);

drop policy if exists "anyone can update" on public.deliverable_status;
create policy "anyone can update" on public.deliverable_status for update using (true);

-- Enable Realtime so every open client stays in sync within ~1s.
alter publication supabase_realtime add table public.deliverable_status;
```

> No auth wall is intentional — this is a small trusted crew. Open read/write RLS.

## Local development

```bash
npm install      # or: yarn
npm run dev      # http://localhost:3000
```

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel (framework auto-detects Next.js).
2. Add the two `NEXT_PUBLIC_SUPABASE_*` env vars.
3. Deploy. Update `APP_URL` in `src/lib/data.ts` to your final domain when known
   (used as the share-link fallback).

## Updating content for future years

Edit only `src/lib/data.ts`. The UI is fully data-driven; the `id` values in
`DELIVERABLES` / `SOCIALS` are the Supabase row keys for live status.

## Valid status `id` values

Production videos: `intro-prelim, fire-dress, intro-teen-finals, intro-miss-finals,
parade, teen-program, talent-intro, interviews-teen, interviews-miss, palmetto-stars,
week-review, scholarship, replacement-topic`

Social cuts: `pj-recap, interview-reel, miss-hype, teen-hype, teen-crown, miss-crown,
emcee, talent-recap, prelim-teen-recap, prelim-miss-recap, tea-party`
