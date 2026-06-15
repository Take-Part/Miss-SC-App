"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured, STATUS_TABLE } from "./supabase";
import {
  type StatusRow,
  type StatusValue,
  type StatusLink,
  DEFAULT_STATUS,
} from "./status";

/** Fields that can be written via updateFields / addDeliverable. */
export type EditableFields = Pick<
  StatusRow,
  | "status"
  | "title"
  | "notes"
  | "loc"
  | "due"
  | "links"
  | "delivered_link"
  | "hidden"
  | "is_custom"
  | "kind"
  | "must"
  | "film"
  | "film_days"
  | "due_day"
>;

/** Payload for creating a brand-new (custom) deliverable. */
export interface NewDeliverablePayload {
  kind: "video" | "social";
  must: boolean;
  title: string;
  notes: string;
  loc: string | null;
  due: string;
  film: string;
  links: StatusLink[] | null;
}

export interface UseStatuses {
  /** map of id -> row (only ids that have been written). */
  map: Record<string, StatusRow>;
  /** convenience: resolve any id to its current status (default not_started). */
  statusOf: (id: string) => StatusValue;
  rowOf: (id: string) => StatusRow | undefined;
  setStatus: (id: string, status: StatusValue) => void;
  /** Upsert any subset of editable columns (status + content overrides). */
  updateFields: (id: string, partial: Partial<EditableFields>) => void;
  /** Create a new custom deliverable; returns its generated id. */
  addDeliverable: (payload: NewDeliverablePayload) => string;
  /** Permanently remove a row (used to purge custom items). */
  deleteRow: (id: string) => void;
  configured: boolean;
  connected: boolean;
  /** initial load finished (or skipped when unconfigured). */
  loaded: boolean;
  error: string | null;
  /** ticks every 30s so relative timestamps stay fresh. */
  tick: number;
  initials: string;
  setInitials: (v: string) => void;
}

export function useStatuses(): UseStatuses {
  const [map, setMap] = useState<Record<string, StatusRow>>({});
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(!isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [initials, setInitialsState] = useState("");
  const mapRef = useRef(map);
  mapRef.current = map;

  // Load saved initials (used as updated_by).
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("tpc_initials");
      if (v) setInitialsState(v);
    } catch {
      /* ignore */
    }
  }, []);

  const setInitials = useCallback((v: string) => {
    const clean = v.slice(0, 12);
    setInitialsState(clean);
    try {
      window.localStorage.setItem("tpc_initials", clean);
    } catch {
      /* ignore */
    }
  }, []);

  // Keep relative timestamps fresh.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Initial fetch + realtime subscription. Degrades gracefully if unconfigured.
  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    const sb = supabase; // non-null reference (narrowing is lost inside closures)
    let active = true;

    (async () => {
      const { data, error } = await sb
        .from(STATUS_TABLE)
        .select("*");
      if (!active) return;
      if (error) {
        setError("Live status offline — schedules still work.");
        setLoaded(true);
        return;
      }
      const next: Record<string, StatusRow> = {};
      for (const r of data as StatusRow[]) next[r.id] = r;
      setMap(next);
      setLoaded(true);
    })();

    const channel = sb
      .channel("deliverable_status_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: STATUS_TABLE },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string })?.id;
            if (!oldId) return;
            setMap((prev) => {
              const copy = { ...prev };
              delete copy[oldId];
              return copy;
            });
            return;
          }
          const row = payload.new as StatusRow;
          if (!row?.id) return;
          setMap((prev) => ({ ...prev, [row.id]: row }));
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnected(false);
        }
      });

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, []);

  const statusOf = useCallback(
    (id: string): StatusValue => map[id]?.status ?? DEFAULT_STATUS,
    [map]
  );
  const rowOf = useCallback((id: string) => map[id], [map]);

  const updateFields = useCallback(
    (id: string, partial: Partial<EditableFields>) => {
      const prev = mapRef.current[id];
      const now = new Date().toISOString();
      const by = initials || null;
      const base: StatusRow =
        prev ?? { id, status: DEFAULT_STATUS, updated_at: now, updated_by: by };
      const optimistic: StatusRow = {
        ...base,
        ...partial,
        id,
        updated_at: now,
        updated_by: by,
      };
      // optimistic update — instant UI feedback
      setMap((p) => ({ ...p, [id]: optimistic }));

      if (!supabase) return;
      const sb = supabase; // non-null reference for the async .then below
      sb
        .from(STATUS_TABLE)
        .upsert({ id, ...partial, updated_at: now, updated_by: by })
        .then(({ error }) => {
          if (error) {
            setError("Couldn’t save — check connection.");
            // revert on failure (last-write-wins otherwise)
            setMap((p) => {
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

  const addDeliverable = useCallback(
    (payload: NewDeliverablePayload): string => {
      const rnd =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const id = `cd_${rnd}`;
      const now = new Date().toISOString();
      const by = initials || null;
      const fields = {
        status: DEFAULT_STATUS,
        is_custom: true,
        hidden: false,
        kind: payload.kind,
        must: payload.kind === "social" ? payload.must : null,
        title: payload.title,
        notes: payload.notes,
        loc: payload.loc,
        due: payload.due,
        film: payload.film,
        links: payload.links,
      };
      const row: StatusRow = { id, updated_at: now, updated_by: by, ...fields };
      setMap((p) => ({ ...p, [id]: row }));

      if (supabase) {
        const sb = supabase;
        sb
          .from(STATUS_TABLE)
          .upsert({ id, ...fields, updated_at: now, updated_by: by })
          .then(({ error }) => {
            if (error) {
              setError("Couldn’t add — check connection.");
              setMap((p) => {
                const copy = { ...p };
                delete copy[id];
                return copy;
              });
              setTimeout(() => setError(null), 4000);
            }
          });
      }
      return id;
    },
    [initials]
  );

  const deleteRow = useCallback((id: string) => {
    const prev = mapRef.current[id];
    setMap((p) => {
      const copy = { ...p };
      delete copy[id];
      return copy;
    });
    if (supabase) {
      const sb = supabase;
      sb
        .from(STATUS_TABLE)
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) {
            setError("Couldn’t delete — check connection.");
            if (prev) setMap((p) => ({ ...p, [id]: prev }));
            setTimeout(() => setError(null), 4000);
          }
        });
    }
  }, []);

  const setStatus = useCallback(
    (id: string, status: StatusValue) => updateFields(id, { status }),
    [updateFields]
  );

  return {
    map,
    statusOf,
    rowOf,
    setStatus,
    updateFields,
    addDeliverable,
    deleteRow,
    configured: isSupabaseConfigured,
    connected,
    loaded,
    error,
    tick,
    initials,
    setInitials,
  };
}
