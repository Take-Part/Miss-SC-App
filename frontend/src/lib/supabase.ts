import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True only when both env vars are present. Used to gracefully degrade. */
export const isSupabaseConfigured: boolean = Boolean(url && anon);

/**
 * A single shared Supabase client for the browser.
 * Returns null when env vars are missing so the rest of the (static) app
 * keeps working without ever throwing / white-screening.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anon as string, {
      realtime: { params: { eventsPerSecond: 10 } },
      auth: { persistSession: false },
    })
  : null;

export const STATUS_TABLE = "deliverable_status";
