-- ============================================================================
-- Miss South Carolina CY26 — Crew App
-- Migration 0003: add / delete (hide) support for deliverables
-- Run ONCE in Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================================

ALTER TABLE public.deliverable_status
  ADD COLUMN IF NOT EXISTS hidden     boolean NOT NULL DEFAULT false, -- soft-delete flag
  ADD COLUMN IF NOT EXISTS is_custom  boolean NOT NULL DEFAULT false, -- created in-app (not from data.ts)
  ADD COLUMN IF NOT EXISTS kind       text,    -- custom items: 'video' | 'social'
  ADD COLUMN IF NOT EXISTS must       boolean, -- social only: true=must-have, false=nice-to-have
  ADD COLUMN IF NOT EXISTS film       text,    -- custom items: film / when label
  ADD COLUMN IF NOT EXISTS film_days  jsonb,   -- optional: string[] of day codes
  ADD COLUMN IF NOT EXISTS due_day    text;    -- optional: due-day code

-- Make sure PostgREST picks up the new columns immediately.
NOTIFY pgrst, 'reload schema';
