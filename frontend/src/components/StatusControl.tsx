"use client";

import { cn, relativeTime } from "@/lib/utils";
import { STATUSES, STATUS_META, type StatusValue } from "@/lib/status";
import type { StatusRow } from "@/lib/status";

export function StatusControl({
  id,
  row,
  onSet,
  disabled,
}: {
  id: string;
  row: StatusRow | undefined;
  onSet: (id: string, status: StatusValue) => void;
  disabled?: boolean;
}) {
  const current: StatusValue = row?.status ?? "not_started";
  const showMeta = !!row && current !== "not_started";

  return (
    <div>
      <div
        role="group"
        aria-label="Production status"
        className="grid grid-cols-4 gap-1 rounded-xl bg-ink/5 p-1"
      >
        {STATUSES.map((s) => {
          const meta = STATUS_META[s];
          const active = s === current;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onSet(id, s)}
              className={cn(
                "flex items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11.5px] font-semibold transition-all duration-150",
                active
                  ? cn(meta.activeBg, meta.activeText, "shadow-sm")
                  : "text-ink/50 hover:bg-card hover:text-ink/80",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {!active && (
                <span
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)}
                />
              )}
              <span className="truncate">{meta.short}</span>
            </button>
          );
        })}
      </div>
      {showMeta && (
        <p className="mt-1.5 pl-1 text-[11px] text-ink/40">
          updated {relativeTime(row!.updated_at)}
          {row!.updated_by ? ` · ${row!.updated_by}` : ""}
        </p>
      )}
    </div>
  );
}
