"use client";

import { useEffect, useMemo, useState } from "react";
import { DELIVERABLES, SOCIALS } from "@/lib/data";
import type { RefLink } from "@/lib/data";
import { cn, dowIndex, isHardDue, isTbdDue } from "@/lib/utils";
import type { UseStatuses } from "@/lib/useStatuses";
import {
  VideoSocialTag,
  MapLink,
  RefChips,
  SearchBox,
  PillToggle,
  DayChip,
  SectionTitle,
  EmptyState,
} from "../primitives";
import { StatusControl } from "../StatusControl";

type DayMode = "filming" | "due";
type TypeFilter = "all" | "video" | "social";
type Group = "video" | "must" | "nice";

interface Unified {
  id: string;
  kind: "video" | "social";
  group: Group;
  title: string;
  filmDays: string[];
  dueDay: string | null;
  filmLabel: string;
  loc: string | null;
  startMin: number | null;
  due: string;
  socialsNote?: string;
  notes: string;
  links?: RefLink[];
}

const UNIFIED: Unified[] = [
  ...DELIVERABLES.map((d): Unified => ({
    id: d.id,
    kind: "video",
    group: "video",
    title: d.title,
    filmDays: d.filmDays,
    dueDay: d.dueDay,
    filmLabel: `${d.film.day} · ${d.film.window}`,
    loc: d.film.loc,
    startMin: d.film.startMin,
    due: d.due,
    socialsNote: d.socials && d.socials !== "—" ? d.socials : undefined,
    notes: d.notes,
    links: d.links,
  })),
  ...SOCIALS.map((s): Unified => ({
    id: s.id,
    kind: "social",
    group: s.must ? "must" : "nice",
    title: s.title,
    filmDays: s.filmDays,
    dueDay: s.dueDay,
    filmLabel: s.film,
    loc: s.loc,
    startMin: null,
    due: s.due,
    notes: s.notes,
    links: s.links,
  })),
];

function DueText({ due }: { due: string }) {
  const hard = isHardDue(due);
  const tbd = isTbdDue(due);
  return (
    <span
      className={cn(
        hard ? "font-semibold text-deadline" : tbd ? "italic text-ink/45" : "text-ink/70"
      )}
    >
      {due}
    </span>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-12 shrink-0 text-[10.5px] font-semibold uppercase tracking-wide text-ink/40">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-[12.5px] text-ink/75">{children}</span>
    </div>
  );
}

function DeliverableCard({
  item,
  statuses,
}: {
  item: Unified;
  statuses: UseStatuses;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <VideoSocialTag kind={item.kind} />
        {item.kind === "social" && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              item.group === "must"
                ? "bg-sash/10 text-sash"
                : "bg-ink/6 text-ink/50"
            )}
          >
            {item.group === "must" ? "Must-have" : "Nice-to-have"}
          </span>
        )}
      </div>
      <h3 className="mt-2 font-serif text-[16px] font-semibold leading-snug text-ink">
        {item.title}
      </h3>

      <div className="mt-3 space-y-1.5">
        <MetaRow label="Film">{item.filmLabel}</MetaRow>
        <MetaRow label="Where">
          {item.loc ? <MapLink loc={item.loc} /> : <span className="text-ink/40">—</span>}
        </MetaRow>
        <MetaRow label="Due">
          <DueText due={item.due} />
        </MetaRow>
        {item.socialsNote && (
          <MetaRow label="Social">{item.socialsNote}</MetaRow>
        )}
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/60">
        {item.notes}
      </p>

      {item.links && item.links.length > 0 && (
        <div className="mt-2.5">
          <RefChips links={item.links} />
        </div>
      )}

      <div className="mt-3.5 border-t border-line/70 pt-3">
        <StatusControl
          id={item.id}
          row={statuses.rowOf(item.id)}
          onSet={statuses.setStatus}
        />
      </div>
    </div>
  );
}

export function DeliverablesTab({ statuses }: { statuses: UseStatuses }) {
  const [dayMode, setDayMode] = useState<DayMode>("filming");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Switching filming/due changes the day axis — clear the day selection.
  useEffect(() => {
    setSelectedDay(null);
  }, [dayMode]);

  const byType = (i: Unified) =>
    typeFilter === "all" ||
    (typeFilter === "video" && i.kind === "video") ||
    (typeFilter === "social" && i.kind === "social");

  // Day chips (driven by type filter + mode, independent of the text query).
  const dayChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of UNIFIED) {
      if (!byType(i)) continue;
      if (dayMode === "filming") {
        for (const d of i.filmDays) counts.set(d, (counts.get(d) ?? 0) + 1);
      } else if (i.dueDay) {
        counts.set(i.dueDay, (counts.get(i.dueDay) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => dowIndex(a[0]) - dowIndex(b[0]))
      .map(([day, count]) => ({ day, count }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayMode, typeFilter]);

  const q = query.trim().toLowerCase();
  const byQuery = (i: Unified) =>
    !q ||
    [i.title, i.due, i.notes].join(" ").toLowerCase().includes(q);

  // ----- Flat (single day selected) -----
  const flat = useMemo(() => {
    if (!selectedDay) return null;
    let list = UNIFIED.filter(byType).filter(byQuery).filter((i) =>
      dayMode === "filming"
        ? i.filmDays.includes(selectedDay)
        : i.dueDay === selectedDay
    );
    if (dayMode === "filming") {
      list = [...list].sort((a, b) => {
        const am = a.startMin ?? Number.POSITIVE_INFINITY;
        const bm = b.startMin ?? Number.POSITIVE_INFINITY;
        return am - bm;
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, dayMode, typeFilter, q]);

  // ----- Grouped (All) -----
  const grouped = useMemo(() => {
    const visible = UNIFIED.filter(byType).filter(byQuery);
    return {
      video: visible.filter((i) => i.group === "video"),
      must: visible.filter((i) => i.group === "must"),
      nice: visible.filter((i) => i.group === "nice"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, q]);

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      <div className="flex gap-2.5 rounded-xl border border-deadline/25 bg-deadline/5 p-3.5">
        <span className="text-base leading-none text-deadline" aria-hidden>
          ⚠
        </span>
        <p className="text-[12.5px] leading-relaxed text-ink/75">
          Sunday 6/14 stacks Parade (8AM), all intro interviews (1–5PM), and Teen
          Program + Scholarship (3–5PM) against a closed all-day Township
          rehearsal — confirm the delegate pull schedule and locations with{" "}
          <span className="font-semibold text-ink">Morgan</span>.
        </p>
      </div>

      {/* Live status meta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink/50">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              statuses.configured && statuses.connected
                ? "bg-shoot"
                : "bg-ink/25"
            )}
          />
          {statuses.configured
            ? statuses.connected
              ? "Live · synced with crew"
              : "Connecting…"
            : "Live status offline"}
        </div>
        <label className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink/50">
          Updating as
          <input
            value={statuses.initials}
            suppressHydrationWarning
            onChange={(e) => statuses.setInitials(e.target.value)}
            placeholder="—"
            maxLength={12}
            className="w-16 rounded-md border border-line bg-card px-2 py-1 text-center text-[12px] font-semibold uppercase text-ink outline-none focus:border-crown/50"
          />
        </label>
      </div>

      {statuses.error && (
        <div className="rounded-lg bg-deadline/10 px-3 py-2 text-[12px] font-medium text-deadline">
          {statuses.error}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <PillToggle<DayMode>
            size="sm"
            options={[
              { value: "filming", label: "Filming day" },
              { value: "due", label: "Due day" },
            ]}
            value={dayMode}
            onChange={setDayMode}
          />
          <PillToggle<TypeFilter>
            size="sm"
            options={[
              { value: "all", label: "All" },
              { value: "video", label: "Video" },
              { value: "social", label: "Social" },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
          />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <DayChip
            label="All"
            active={selectedDay === null}
            onClick={() => setSelectedDay(null)}
          />
          {dayChips.map(({ day, count }) => (
            <DayChip
              key={day}
              label={day}
              count={count}
              active={selectedDay === day}
              onClick={() => setSelectedDay(day)}
            />
          ))}
        </div>
      </div>

      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Search deliverables…"
      />

      {/* List */}
      {flat ? (
        flat.length === 0 ? (
          <EmptyState>No deliverables for this day.</EmptyState>
        ) : (
          <div className="space-y-3">
            {flat.map((item) => (
              <DeliverableCard
                key={item.id}
                item={item}
                statuses={statuses}
              />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {grouped.video.length > 0 && (
            <section className="space-y-3">
              <SectionTitle count={grouped.video.length}>
                Production Videos
              </SectionTitle>
              {grouped.video.map((item) => (
                <DeliverableCard key={item.id} item={item} statuses={statuses} />
              ))}
            </section>
          )}
          {grouped.must.length > 0 && (
            <section className="space-y-3">
              <SectionTitle count={grouped.must.length}>
                Social — Must-Have
              </SectionTitle>
              {grouped.must.map((item) => (
                <DeliverableCard key={item.id} item={item} statuses={statuses} />
              ))}
            </section>
          )}
          {grouped.nice.length > 0 && (
            <section className="space-y-3">
              <SectionTitle count={grouped.nice.length}>
                Social — Nice-to-Have
              </SectionTitle>
              {grouped.nice.map((item) => (
                <DeliverableCard key={item.id} item={item} statuses={statuses} />
              ))}
            </section>
          )}
          {grouped.video.length === 0 &&
            grouped.must.length === 0 &&
            grouped.nice.length === 0 && (
              <EmptyState>No deliverables match your filters.</EmptyState>
            )}
        </div>
      )}
    </div>
  );
}
