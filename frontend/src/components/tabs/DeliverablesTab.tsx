"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, ExternalLink, Plus, Trash2, Archive } from "lucide-react";
import { DELIVERABLES, SOCIALS } from "@/lib/data";
import type { RefLink } from "@/lib/data";
import { cn, dowIndex, isHardDue, isTbdDue, resolveLoc } from "@/lib/utils";
import type { UseStatuses } from "@/lib/useStatuses";
import type { StatusRow, StatusLink } from "@/lib/status";
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
import {
  EditDialog,
  DeliveredDialog,
  AddDeliverableDialog,
  ConfirmDialog,
  HiddenDialog,
  type EditableItem,
  type CurrentValues,
  type EditPartial,
  type NewDeliverableInput,
  type HiddenEntry,
} from "../DeliverableDialogs";

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

/** Build a Unified item from a custom (in-app created) Supabase row. */
function rowToUnified(row: StatusRow): Unified {
  const kind: "video" | "social" = row.kind === "social" ? "social" : "video";
  const group: Group = kind === "video" ? "video" : row.must ? "must" : "nice";
  return {
    id: row.id,
    kind,
    group,
    title: row.title ?? "Untitled",
    filmDays: Array.isArray(row.film_days) ? row.film_days : [],
    dueDay: row.due_day ?? null,
    filmLabel: row.film ?? "—",
    loc: row.loc ?? null,
    startMin: null,
    due: row.due ?? "TBD",
    notes: row.notes ?? "",
    links: (row.links ?? undefined) as RefLink[] | undefined,
  };
}

/** Merge a static item with any saved overrides. */
function eff(item: Unified, row?: StatusRow) {
  return {
    title: row?.title ?? item.title,
    notes: row?.notes ?? item.notes,
    loc: row?.loc ?? item.loc,
    due: row?.due ?? item.due,
    links: (row?.links ?? item.links) as RefLink[] | undefined,
    deliveredLink: row?.delivered_link ?? null,
  };
}

function DueText({ due }: { due: string }) {
  const hard = isHardDue(due);
  const tbd = isTbdDue(due);
  return (
    <span
      className={cn(
        hard
          ? "font-semibold text-deadline"
          : tbd
          ? "italic text-ink/45"
          : "text-ink/70"
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
  onEdit,
  onDelivered,
  onEditLink,
  onDelete,
  innerRef,
  highlighted,
}: {
  item: Unified;
  statuses: UseStatuses;
  onEdit: (id: string) => void;
  onDelivered: (id: string) => void;
  onEditLink: (id: string) => void;
  onDelete: (id: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  highlighted?: boolean;
}) {
  const row = statuses.rowOf(item.id);
  const e = eff(item, row);
  const status = row?.status ?? "not_started";
  const origLocName = resolveLoc(item.loc)?.name ?? "";
  const effLocName = resolveLoc(e.loc)?.name ?? "";
  const edited =
    e.title !== item.title ||
    e.notes !== item.notes ||
    e.due !== item.due ||
    effLocName !== origLocName ||
    JSON.stringify(e.links ?? []) !== JSON.stringify(item.links ?? []);

  return (
    <div
      ref={innerRef}
      data-testid={`deliverable-card-${item.id}`}
      className={cn(
        "scroll-mt-24 rounded-2xl border border-line bg-card p-4 shadow-soft",
        highlighted && "card-highlight"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
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
          {edited && (
            <span className="rounded-full bg-crown/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crown-deep">
              Edited
            </span>
          )}
        </div>
        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            aria-label="Edit deliverable"
            data-testid={`edit-deliverable-${item.id}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label="Delete deliverable"
            data-testid={`delete-deliverable-${item.id}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-deadline/8 hover:text-deadline"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h3 className="mt-2 font-serif text-[16px] font-semibold leading-snug text-ink">
        {e.title}
      </h3>

      <div className="mt-3 space-y-1.5">
        <MetaRow label="Film">{item.filmLabel}</MetaRow>
        <MetaRow label="Where">
          {e.loc ? (
            <MapLink loc={e.loc} />
          ) : (
            <span className="text-ink/40">—</span>
          )}
        </MetaRow>
        <MetaRow label="Due">
          <DueText due={e.due} />
        </MetaRow>
        {item.socialsNote && <MetaRow label="Social">{item.socialsNote}</MetaRow>}
      </div>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/60">{e.notes}</p>

      {e.links && e.links.length > 0 && (
        <div className="mt-2.5">
          <RefChips links={e.links} />
        </div>
      )}

      <div className="mt-3.5 border-t border-line/70 pt-3">
        <StatusControl
          id={item.id}
          row={row}
          onSet={statuses.setStatus}
          onRequestDelivered={onDelivered}
        />
      </div>

      {status === "delivered" && (
        <div className="mt-2.5">
          {e.deliveredLink ? (
            <div className="flex items-center gap-2 rounded-xl bg-sash/8 px-3 py-2.5">
              <a
                href={e.deliveredLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-semibold text-sash hover:underline"
              >
                <ExternalLink size={15} className="shrink-0" />
                <span className="truncate">Open delivery</span>
              </a>
              <button
                type="button"
                onClick={() => onEditLink(item.id)}
                className="shrink-0 text-[12px] font-semibold text-ink/45 hover:text-ink"
              >
                Edit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEditLink(item.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-sash/40 bg-sash/5 px-3 py-2.5 text-[13px] font-semibold text-sash transition-colors hover:bg-sash/10"
            >
              <Plus size={15} /> Add delivery link
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DeliverablesTab({
  statuses,
  focusId,
  onFocusHandled,
}: {
  statuses: UseStatuses;
  focusId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [dayMode, setDayMode] = useState<DayMode>("filming");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deliver, setDeliver] = useState<{
    id: string;
    phase: "confirm" | "link";
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Merge built-in (data.ts) items with custom (in-app) ones, and split off
  // anything that's been hidden (soft-deleted).
  const { liveItems, hiddenItems } = useMemo(() => {
    const rows = Object.values(statuses.map);
    const customs = rows.filter((r) => r.is_custom).map(rowToUnified);
    const hiddenSet = new Set(rows.filter((r) => r.hidden).map((r) => r.id));
    const everything = [...UNIFIED, ...customs];
    return {
      liveItems: everything.filter((i) => !hiddenSet.has(i.id)),
      hiddenItems: everything.filter((i) => hiddenSet.has(i.id)),
    };
  }, [statuses.map]);

  const hiddenEntries: HiddenEntry[] = hiddenItems.map((i) => ({
    id: i.id,
    title: eff(i, statuses.rowOf(i.id)).title,
    kind: i.kind,
    isCustom: !!statuses.rowOf(i.id)?.is_custom,
  }));

  // Cross-navigation: scroll to + briefly highlight a deliverable that was
  // opened from the Today / Schedule tabs.
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    // Make sure the target is visible in the default (grouped) view.
    setSelectedDay(null);
    setTypeFilter("all");
    setQuery("");
    const raf = requestAnimationFrame(() => {
      const el = cardRefs.current[focusId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightId(focusId);
        window.setTimeout(() => setHighlightId(null), 2200);
      }
      onFocusHandled?.();
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  // Switching filming/due changes the day axis — clear the day selection.
  useEffect(() => {
    setSelectedDay(null);
  }, [dayMode]);

  const byType = (i: Unified) =>
    typeFilter === "all" ||
    (typeFilter === "video" && i.kind === "video") ||
    (typeFilter === "social" && i.kind === "social");

  const q = query.trim().toLowerCase();
  const byQuery = (i: Unified) => {
    if (!q) return true;
    const e = eff(i, statuses.rowOf(i.id));
    return [e.title, e.due, e.notes].join(" ").toLowerCase().includes(q);
  };

  // Day chips (driven by type filter + mode; independent of text query).
  const dayChips = (() => {
    const counts = new Map<string, number>();
    for (const i of liveItems) {
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
  })();

  // Flat (single day) vs grouped (All).
  let flat: Unified[] | null = null;
  if (selectedDay) {
    flat = liveItems
      .filter(byType)
      .filter(byQuery)
      .filter((i) =>
        dayMode === "filming"
          ? i.filmDays.includes(selectedDay)
          : i.dueDay === selectedDay
      );
    if (dayMode === "filming") {
      flat = [...flat].sort((a, b) => {
        const am = a.startMin ?? Number.POSITIVE_INFINITY;
        const bm = b.startMin ?? Number.POSITIVE_INFINITY;
        return am - bm;
      });
    }
  }

  const visible = liveItems.filter(byType).filter(byQuery);
  const grouped = {
    video: visible.filter((i) => i.group === "video"),
    must: visible.filter((i) => i.group === "must"),
    nice: visible.filter((i) => i.group === "nice"),
  };

  const cardProps = {
    statuses,
    onEdit: (id: string) => setEditingId(id),
    onDelivered: (id: string) => setDeliver({ id, phase: "confirm" as const }),
    onEditLink: (id: string) => setDeliver({ id, phase: "link" as const }),
    onDelete: (id: string) => {
      const t = eff(
        liveItems.find((i) => i.id === id) ?? ({ title: "this item" } as Unified),
        statuses.rowOf(id)
      ).title;
      setConfirmDelete({ id, title: t });
    },
  };

  const renderCard = (item: Unified) => (
    <DeliverableCard
      key={item.id}
      item={item}
      innerRef={(el) => {
        cardRefs.current[item.id] = el;
      }}
      highlighted={highlightId === item.id}
      {...cardProps}
    />
  );

  // Dialog data
  const editingItem = editingId
    ? liveItems.find((i) => i.id === editingId) ?? null
    : null;
  const editingIsCustom = editingItem
    ? !!statuses.rowOf(editingItem.id)?.is_custom
    : false;
  const editableItem: EditableItem | null = editingItem
    ? {
        id: editingItem.id,
        kind: editingItem.kind,
        title: editingItem.title,
        notes: editingItem.notes,
        loc: editingItem.loc,
        due: editingItem.due,
        links: editingItem.links,
      }
    : null;
  const editingCurrent: CurrentValues | null = editingItem
    ? (() => {
        const e = eff(editingItem, statuses.rowOf(editingItem.id));
        return {
          title: e.title,
          notes: e.notes,
          locText: e.loc ? resolveLoc(e.loc)?.name ?? e.loc : "",
          due: e.due,
          links: (e.links ?? []) as StatusLink[],
        };
      })()
    : null;

  const handleSave = (partial: EditPartial) => {
    if (!editingItem) return;
    // Custom (in-app) items store literal values — no "original" to collapse to.
    if (editingIsCustom) {
      statuses.updateFields(editingItem.id, {
        title: partial.title,
        notes: partial.notes,
        loc: partial.loc,
        due: partial.due,
        links: partial.links,
      });
      return;
    }
    const origLocName = resolveLoc(editingItem.loc)?.name ?? "";
    // Collapse fields that match the original back to null (no override).
    const title =
      partial.title && partial.title !== editingItem.title
        ? partial.title
        : null;
    const notes =
      partial.notes && partial.notes !== editingItem.notes
        ? partial.notes
        : null;
    const due =
      partial.due && partial.due !== editingItem.due ? partial.due : null;
    const loc =
      partial.loc && partial.loc !== origLocName ? partial.loc : null;
    const links =
      partial.links &&
      JSON.stringify(partial.links) !==
        JSON.stringify(editingItem.links ?? [])
        ? partial.links
        : null;
    statuses.updateFields(editingItem.id, { title, notes, loc, due, links });
  };

  const deliverItem = deliver
    ? liveItems.find((i) => i.id === deliver.id) ?? null
    : null;
  const deliverRow = deliver ? statuses.rowOf(deliver.id) : undefined;

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

      {/* Manage actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          data-testid="add-deliverable-btn"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-bold text-paper transition-colors hover:bg-ink/90"
        >
          <Plus size={16} /> Add deliverable
        </button>
        {hiddenEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setHiddenOpen(true)}
            data-testid="hidden-deliverables-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold text-ink/60 transition-colors hover:bg-ink/5"
          >
            <Archive size={15} /> Hidden ({hiddenEntries.length})
          </button>
        )}
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
            {flat.map((item) => renderCard(item))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {grouped.video.length > 0 && (
            <section className="space-y-3">
              <SectionTitle count={grouped.video.length}>
                Production Videos
              </SectionTitle>
              {grouped.video.map((item) => renderCard(item))}
            </section>
          )}
          {grouped.must.length > 0 && (
            <section className="space-y-3">
              <SectionTitle count={grouped.must.length}>
                Social — Must-Have
              </SectionTitle>
              {grouped.must.map((item) => renderCard(item))}
            </section>
          )}
          {grouped.nice.length > 0 && (
            <section className="space-y-3">
              <SectionTitle count={grouped.nice.length}>
                Social — Nice-to-Have
              </SectionTitle>
              {grouped.nice.map((item) => renderCard(item))}
            </section>
          )}
          {grouped.video.length === 0 &&
            grouped.must.length === 0 &&
            grouped.nice.length === 0 && (
              <EmptyState>No deliverables match your filters.</EmptyState>
            )}
        </div>
      )}

      {/* Dialogs */}
      {editableItem && editingCurrent && (
        <EditDialog
          open
          item={editableItem}
          current={editingCurrent}
          allowReset={!editingIsCustom}
          onClose={() => setEditingId(null)}
          onSave={handleSave}
          onReset={() =>
            statuses.updateFields(editableItem.id, {
              title: null,
              notes: null,
              loc: null,
              due: null,
              links: null,
            })
          }
        />
      )}

      {deliver && deliverItem && (
        <DeliveredDialog
          open
          phase={deliver.phase}
          title={eff(deliverItem, deliverRow).title}
          currentLink={deliverRow?.delivered_link ?? null}
          onClose={() => setDeliver(null)}
          onConfirm={() => statuses.setStatus(deliver.id, "delivered")}
          onSaveLink={(link) =>
            statuses.updateFields(deliver.id, {
              status: "delivered",
              delivered_link: link || null,
            })
          }
        />
      )}

      <AddDeliverableDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={(payload: NewDeliverableInput) =>
          statuses.addDeliverable(payload)
        }
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this deliverable?"
        message={
          <>
            <span className="font-semibold text-ink">
              {confirmDelete?.title}
            </span>{" "}
            will be hidden for the whole crew. You can bring it back any time from{" "}
            <span className="font-semibold text-ink">Hidden</span>.
          </>
        }
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete)
            statuses.updateFields(confirmDelete.id, { hidden: true });
        }}
      />

      <HiddenDialog
        open={hiddenOpen}
        items={hiddenEntries}
        onClose={() => setHiddenOpen(false)}
        onRestore={(id) => statuses.updateFields(id, { hidden: false })}
        onPurge={(id) => statuses.deleteRow(id)}
      />
    </div>
  );
}
