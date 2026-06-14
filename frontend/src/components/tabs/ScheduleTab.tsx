"use client";

import { useEffect, useMemo, useState } from "react";
import { SCHEDULE, MASTER, findDeliverableMeta } from "@/lib/data";
import type { ScheduleItem, MasterItem } from "@/lib/data";
import { cn, resolveLoc, todayDate } from "@/lib/utils";
import {
  TypeTag,
  BrollTag,
  StarTag,
  MapLink,
  DeliverableLink,
  SearchBox,
  PillToggle,
  EmptyState,
} from "../primitives";

type Mode = "shoots" | "master";

function maxItemsDate(source: { date: string; items: unknown[] }[]): string {
  let best = source[0]?.date ?? "";
  let max = -1;
  for (const d of source) {
    if (d.items.length > max) {
      max = d.items.length;
      best = d.date;
    }
  }
  return best;
}

export function ScheduleTab({
  onOpenDeliverable,
}: {
  onOpenDeliverable: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("shoots");
  const [brollOnly, setBrollOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([maxItemsDate(SCHEDULE)])
  );

  // Reset expansion + filters when switching modes.
  // Auto-expand the REAL current day (client clock); fall back to the busiest day.
  useEffect(() => {
    const src = mode === "shoots" ? SCHEDULE : MASTER;
    const today = todayDate(src);
    setExpanded(new Set([today ?? maxItemsDate(src)]));
    setBrollOnly(false);
  }, [mode]);

  const q = query.trim().toLowerCase();
  const source = mode === "shoots" ? SCHEDULE : MASTER;

  const matchShoot = (it: ScheduleItem) =>
    [it.time, it.title, it.crew, resolveLoc(it.loc)?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q);
  const matchMaster = (it: MasterItem) =>
    [it.time, it.title, it.sub ?? "", resolveLoc(it.loc)?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q);

  const days = useMemo(() => {
    return source
      .map((day) => {
        let items: (ScheduleItem | MasterItem)[] = day.items as (
          | ScheduleItem
          | MasterItem
        )[];
        if (mode === "master" && brollOnly) {
          items = (items as MasterItem[]).filter((i) => i.broll);
        }
        if (q) {
          items =
            mode === "shoots"
              ? (items as ScheduleItem[]).filter(matchShoot)
              : (items as MasterItem[]).filter(matchMaster);
        }
        return { date: day.date, label: day.label, items };
      })
      .filter((day) => {
        if (q) return day.items.length > 0;
        if (mode === "master" && brollOnly) return day.items.length > 0;
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, mode, brollOnly, q]);

  const allDates = days.map((d) => d.date);
  const isOpen = (date: string) => (q ? true : expanded.has(date));
  const toggle = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PillToggle<Mode>
          options={[
            { value: "shoots", label: "Our shoots" },
            { value: "master", label: "Master schedule" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <button
          type="button"
          onClick={() =>
            setExpanded(
              expanded.size >= allDates.length
                ? new Set()
                : new Set(allDates)
            )
          }
          className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink/60 shadow-soft hover:text-ink"
        >
          {expanded.size >= allDates.length && allDates.length > 0
            ? "Collapse all"
            : "Expand all"}
        </button>
      </div>

      {mode === "master" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink/70">
            <input
              type="checkbox"
              checked={brollOnly}
              onChange={(e) => setBrollOnly(e.target.checked)}
              className="h-4 w-4 rounded border-line text-shoot accent-shoot"
            />
            B-roll windows only
          </label>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-shoot" /> B-roll
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-event" /> Star
            </span>
          </div>
        </div>
      )}

      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search the week…"
      />

      {days.length === 0 ? (
        <EmptyState>No matching items.</EmptyState>
      ) : (
        <div className="space-y-2.5">
          {days.map((day) => {
            const open = isOpen(day.date);
            const brollCount =
              mode === "master"
                ? (day.items as MasterItem[]).filter((i) => i.broll).length
                : 0;
            const hasDeadline =
              mode === "shoots" &&
              (day.items as ScheduleItem[]).some((i) => i.type === "deadline");
            return (
              <div
                key={day.date}
                className="overflow-hidden rounded-xl border border-line bg-card shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => toggle(day.date)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                >
                  <svg
                    className={cn(
                      "shrink-0 text-ink/35 transition-transform",
                      open && "rotate-90"
                    )}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="min-w-0 flex-1 font-serif text-[15px] font-semibold leading-snug text-ink">
                    {day.label}
                  </span>
                  {hasDeadline && (
                    <span className="shrink-0 rounded-full bg-deadline/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-deadline">
                      Deadline
                    </span>
                  )}
                  {mode === "master" && brollCount > 0 && (
                    <span className="shrink-0 rounded-full bg-shoot/10 px-2 py-0.5 text-[10.5px] font-semibold text-shoot">
                      {brollCount} b-roll
                    </span>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-ink/40">
                    {day.items.length}
                  </span>
                </button>

                {open && (
                  <div className="space-y-2 border-t border-line/70 px-3 pb-3 pt-2">
                    {mode === "shoots"
                      ? (day.items as ScheduleItem[]).map((it, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-paper/50 p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[12px] font-bold tabular-nums text-crown-deep">
                                {it.time}
                              </span>
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <TypeTag type={it.type} />
                                {it.broll && <BrollTag />}
                              </div>
                            </div>
                            <p className="mt-1 text-[14px] font-medium leading-snug text-ink">
                              {it.title}
                            </p>
                            {it.loc && (
                              <div className="mt-1 text-[12px]">
                                <MapLink loc={it.loc} />
                              </div>
                            )}
                            {it.crew && (
                              <p className="mt-0.5 text-[12px] leading-snug text-ink/55">
                                {it.crew}
                              </p>
                            )}
                            {it.deliv && it.deliv.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {it.deliv.map((id) => {
                                  const meta = findDeliverableMeta(id);
                                  if (!meta) return null;
                                  const multi = (it.deliv as string[]).length > 1;
                                  return (
                                    <DeliverableLink
                                      key={id}
                                      label={
                                        multi
                                          ? meta.title
                                          : "View in Deliverables"
                                      }
                                      onClick={() => onOpenDeliverable(id)}
                                      testid={`schedule-view-deliverable-${id}`}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      : (day.items as MasterItem[]).map((it, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-paper/50 p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[12px] font-bold tabular-nums text-crown-deep">
                                {it.time}
                              </span>
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {it.broll && <BrollTag />}
                                {it.star && <StarTag />}
                              </div>
                            </div>
                            <p className="mt-1 text-[14px] font-medium leading-snug text-ink">
                              {it.title}
                            </p>
                            {it.loc && (
                              <div className="mt-1 text-[12px]">
                                <MapLink loc={it.loc} />
                              </div>
                            )}
                            {it.sub && (
                              <p className="mt-1 text-[12px] italic leading-snug text-ink/55">
                                {it.sub}
                              </p>
                            )}
                          </div>
                        ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
