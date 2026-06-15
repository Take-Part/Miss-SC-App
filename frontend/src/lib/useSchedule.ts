"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

export const SCHEDULE_TABLE = "schedule_items";

export type ScheduleKind = "shoots" | "master";

export interface ScheduleRow {
  id: string;
  kind: ScheduleKind;
  day: string;
  is_custom?: boolean | null;
  is_day?: boolean | null;
  hidden?: boolean | null;
  label?: string | null;
  time?: string | null;
  type?: string | null;
  title?: string | null;
  loc?: string | null;
  crew?: string | null;
  broll?: boolean | null;
  star?: boolean | null;
  sub?: string | null;
  deliv?: string[] | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface UseSchedule {
  rows: Record<string, ScheduleRow>;
  /** Upsert a row. `fields` must include kind + day for brand-new rows. */
  upsertRow: (id: string, fields: Partial<ScheduleRow>) => void;
  /** Permanently delete a row (used to purge custom items / reset overrides). */
  deleteRow: (id: string) => void;
  configured: boolean;
  connected: boolean;
  loaded: boolean;
  error: string | null;
}

export function useSchedule(initials: string): UseSchedule {
  const [rows, setRows] = useState<Record<string, ScheduleRow>>({});
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(!isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    const sb = supabase;
    let active = true;

    (async () => {
      const { data, error } = await sb.from(SCHEDULE_TABLE).select("*");
      if (!active) return;
      if (error) {
        // Table may not exist yet (migration not run) — degrade gracefully.
        setLoaded(true);
        return;
      }
      const next: Record<string, ScheduleRow> = {};
      for (const r of data as ScheduleRow[]) next[r.id] = r;
      setRows(next);
      setLoaded(true);
    })();

    const channel = sb
      .channel("schedule_items_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SCHEDULE_TABLE },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id;
            if (!oldId) return;
            setRows((prev) => {
              const copy = { ...prev };
              delete copy[oldId];
              return copy;
            });
            return;
          }
          const row = payload.new as ScheduleRow;
          if (!row?.id) return;
          setRows((prev) => ({ ...prev, [row.id]: row }));
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, []);

  const upsertRow = useCallback(
    (id: string, fields: Partial<ScheduleRow>) => {
      const prev = rowsRef.current[id];
      const now = new Date().toISOString();
      const by = initials || null;
      const merged = {
        ...(prev ?? {}),
        ...fields,
        id,
        updated_at: now,
        updated_by: by,
      } as ScheduleRow;
      setRows((p) => ({ ...p, [id]: merged }));

      if (!supabase) return;
      const sb = supabase;
      sb
        .from(SCHEDULE_TABLE)
        .upsert(merged)
        .then(({ error }) => {
          if (error) {
            setError("Couldn’t save schedule — check connection.");
            setRows((p) => {
              const copy = { ...p };
              if (prev) copy[id] = prev;
              else delete copy[id];
              return copy;
            });
            setTimeout(() => setError(null), 4000);
          }
        });
    },
    [initials]
  );

  const deleteRow = useCallback((id: string) => {
    const prev = rowsRef.current[id];
    setRows((p) => {
      const copy = { ...p };
      delete copy[id];
      return copy;
    });
    if (supabase) {
      const sb = supabase;
      sb
        .from(SCHEDULE_TABLE)
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) {
            setError("Couldn’t delete — check connection.");
            if (prev) setRows((p) => ({ ...p, [id]: prev }));
            setTimeout(() => setError(null), 4000);
          }
        });
    }
  }, []);

  return {
    rows,
    upsertRow,
    deleteRow,
    configured: isSupabaseConfigured,
    connected,
    loaded,
    error,
  };
}
