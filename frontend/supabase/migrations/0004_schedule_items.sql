-- ============================================================================
-- Miss South Carolina CY26 — Crew App
-- Migration 0004: schedule editing (add / edit / delete-hide / restore + days)
-- Run ONCE in Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_items (
  id          text PRIMARY KEY,
  kind        text NOT NULL,                 -- 'shoots' | 'master'
  day         text NOT NULL,                 -- e.g. 'Sun 6/14'
  is_custom   boolean NOT NULL DEFAULT false, -- created in-app (not from data.ts)
  is_day      boolean NOT NULL DEFAULT false, -- row represents a whole day (custom day or day-hide)
  hidden      boolean NOT NULL DEFAULT false, -- soft-delete (item or day)
  label       text,                          -- day label (for custom / hidden days)
  time        text,
  type        text,                          -- shoots: shoot|deadline|event|logistics
  title       text,
  loc         text,
  crew        text,                          -- shoots
  broll       boolean,
  star        boolean,                        -- master
  sub         text,                          -- master
  deliv       jsonb,                          -- shoots: string[] of deliverable ids
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedule_items select" ON public.schedule_items;
CREATE POLICY "schedule_items select" ON public.schedule_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "schedule_items insert" ON public.schedule_items;
CREATE POLICY "schedule_items insert" ON public.schedule_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "schedule_items update" ON public.schedule_items;
CREATE POLICY "schedule_items update" ON public.schedule_items FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "schedule_items delete" ON public.schedule_items;
CREATE POLICY "schedule_items delete" ON public.schedule_items FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_items;

NOTIFY pgrst, 'reload schema';
