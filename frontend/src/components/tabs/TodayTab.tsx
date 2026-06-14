"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SCHEDULE, DELIVERABLES } from "@/lib/data";
import { cn, splitDate, resolveLoc, todayDate } from "@/lib/utils";
import {
  TypeTag,
  BrollTag,
  MapLink,
  DueChip,
  SearchBox,
  EmptyState,
} from "../primitives";

const DEFAULT_DAY = "Sun 6/14";

const ACCENT: Record<string, string> = {
  shoot: "border-l-shoot",
  deadline: "border-l-deadline",
  event: "border-l-event",
  logistics: "border-l-line",
};

function delivById(id: string) {
  return DELIVERABLES.find((d) => d.id === id);
}

export function TodayTab() {
  const [selected, setSelected] = useState<string>(DEFAULT_DAY);
  const [query, setQuery] = useState("");
  const stripRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const shouldScroll = useRef(false);

  const selectDay = (date: string) => {
    shouldScroll.current = true;
    setSelected(date);
  };

  // On mount, jump to the REAL current day (client clock) if it's in range.
  // Done in an effect (not initial state) to avoid SSR/hydration mismatch and
  // WITHOUT triggering the strip auto-scroll.
  useEffect(() => {
    const today = todayDate(SCHEDULE);
    if (today) setSelected(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Center the selected chip in the strip on tap (never on initial/programmatic load).
  useEffect(() => {
    if (!shouldScroll.current) return;
    shouldScroll.current = false;
    const strip = stripRef.current;
    const chip = chipRefs.current[selected];
    if (strip && chip) {
      const left =
        chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [selected]);

  const day = useMemo(
    () => SCHEDULE.find((d) => d.date === selected),
    [selected]
  );
  const items = day?.items ?? [];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => {
        const locName = resolveLoc(it.loc)?.name ?? "";
        return [it.title, it.crew, locName]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
    : items;

  return (
    <div className="space-y-4">
      {/* Day strip */}
      <div
        ref={stripRef}
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {SCHEDULE.map((d) => {
          const { dow, md } = splitDate(d.date);
          const on = d.date === selected;
          return (
            <button
              key={d.date}
              ref={(el) => {
                chipRefs.current[d.date] = el;
              }}
              type="button"
              onClick={() => selectDay(d.date)}
              className={cn(
                "flex min-w-[56px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition-all",
                on
                  ? "border-crown bg-crown text-white shadow-sm"
                  : "border-line bg-card text-ink/70 hover:border-crown/40"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide",
                  on ? "text-white/85" : "text-ink/45"
                )}
              >
                {dow}
              </span>
              <span
                className={cn(
                  "text-[15px] font-bold tabular-nums",
                  on ? "text-white" : "text-ink"
                )}
              >
                {md}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected day label */}
      {day && (
        <h2 className="font-serif text-lg font-semibold leading-snug text-ink">
          {day.label}
        </h2>
      )}

      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search this day…"
      />

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState>
          {q ? "No items match your search." : "Nothing scheduled for the crew."}
        </EmptyState>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((it, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-xl border border-l-[3px] border-line bg-card p-3.5 shadow-soft",
                ACCENT[it.type] ?? ACCENT.logistics,
                it.type === "deadline" && "bg-deadline/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[12.5px] font-bold tabular-nums text-crown-deep">
                  {it.time}
                </span>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <TypeTag type={it.type} />
                  {it.broll && <BrollTag />}
                </div>
              </div>
              <p className="mt-1.5 text-[14.5px] font-medium leading-snug text-ink">
                {it.title}
              </p>
              {it.loc && (
                <div className="mt-1 text-[12.5px]">
                  <MapLink loc={it.loc} />
                </div>
              )}
              {it.crew && (
                <p className="mt-1 text-[12.5px] leading-snug text-ink/55">
                  {it.crew}
                </p>
              )}
              {it.deliv && it.deliv.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {it.deliv.map((id) => {
                    const d = delivById(id);
                    return d ? (
                      <DueChip key={id} due={d.due} />
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
