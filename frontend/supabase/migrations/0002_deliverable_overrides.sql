-- ============================================================================
-- Miss South Carolina CY26 — Crew App
-- Migration: add editable-override + delivery-link columns to deliverable_status
-- Run this ONCE in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS).
-- ============================================================================

ALTER TABLE public.deliverable_status
  ADD COLUMN IF NOT EXISTS title          text,   -- edited title (null = use data.ts default)
  ADD COLUMN IF NOT EXISTS notes          text,   -- edited description
  ADD COLUMN IF NOT EXISTS loc            text,   -- edited location (free text)
  ADD COLUMN IF NOT EXISTS due            text,   -- edited due text
  ADD COLUMN IF NOT EXISTS links          jsonb,  -- edited example links: [{ "label": "...", "url": "..." }]
  ADD COLUMN IF NOT EXISTS delivered_link text;   -- final delivery link when marked Delivered

-- Make sure PostgREST picks up the new columns immediately.
NOTIFY pgrst, 'reload schema';
