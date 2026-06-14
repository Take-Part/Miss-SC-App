"use client";

import { useMemo, useState } from "react";
import { INTERVIEWS } from "@/lib/data";
import { cn } from "@/lib/utils";

const TABLE_KEYS = [
  "miss_mon_mu",
  "miss_mon_alpha",
  "miss_tue_sigma",
  "teen_mon_silver",
  "teen_mon_gold",
] as const;

type Filter = "All" | "Miss" | "Teen";

export function InterviewsTab() {
  const [filter, setFilter] = useState<Filter>("All");

  const tables = useMemo(
    () => TABLE_KEYS.map((k) => ({ key: k, ...INTERVIEWS[k] })),
    []
  );

  const counts = useMemo(() => {
    let miss = 0;
    let teen = 0;
    for (const t of tables) {
      if (t.group === "Miss") miss += t.rows.length;
      else teen += t.rows.length;
    }
    return { All: miss + teen, Miss: miss, Teen: teen };
  }, [tables]);

  const visible = tables.filter(
    (t) => filter === "All" || t.group === filter
  );

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-2xl border border-event/20 bg-event/5 p-4">
        <p className="font-serif text-[17px] font-semibold text-ink">
          We film both rooms — one camera each.
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/70">
          Take Part covers the Miss and Teen interviews at Colonial Life. Bring
          our own audio + lighting for both rooms. Record every delegate
          individually in front of the judges. Arrive about an hour early to set
          up; enter via the College Street entrance. Miss and Teen run
          simultaneously in separate rooms — two cameras Monday.
        </p>
        <p className="mt-2.5 border-t border-event/15 pt-2.5 text-[12px] italic leading-relaxed text-ink/55">
          {INTERVIEWS.note}
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {(["All", "Miss", "Teen"] as const).map((f) => {
          const on = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all",
                on
                  ? "border-sash bg-sash text-white shadow-sm"
                  : "border-line bg-card text-ink/60 hover:text-ink"
              )}
            >
              {f}
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  on ? "text-white/70" : "text-ink/35"
                )}
              >
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tables */}
      <div className="space-y-4">
        {visible.map((t) => (
          <div
            key={t.key}
            className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line bg-paper/40 px-4 py-2.5">
              <h3 className="font-serif text-[15px] font-semibold leading-snug text-ink">
                {t.label}
              </h3>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
                  t.group === "Miss"
                    ? "bg-sash/10 text-sash"
                    : "bg-event/10 text-event"
                )}
              >
                {t.group}
              </span>
            </div>
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-ink/40">
                  <th className="w-[92px] px-3 py-2 font-semibold">Time</th>
                  <th className="px-2 py-2 font-semibold">Delegate</th>
                  <th className="px-3 py-2 font-semibold">Title</th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-line/60 align-top"
                  >
                    <td className="px-3 py-2 text-[11.5px] font-semibold tabular-nums text-crown-deep">
                      {r[0]}
                    </td>
                    <td className="px-2 py-2 text-[12.5px] font-medium leading-snug text-ink">
                      {r[1]}
                    </td>
                    <td className="px-3 py-2 text-[11.5px] leading-snug text-ink/55">
                      {r[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
