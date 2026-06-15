"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, CalendarPlus, Archive } from "lucide-react";
import { SCHEDULE, MASTER, findDeliverableMeta } from "@/lib/data";
import type { ScheduleItem, MasterItem } from "@/lib/data";
import { cn, resolveLoc, todayDate, parseTimeMin } from "@/lib/utils";
import type { UseSchedule, ScheduleKind, ScheduleRow } from "@/lib/useSchedule";
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
import { ConfirmDialog } from "../DeliverableDialogs";
import {
  ScheduleItemDialog,
  AddDayDialog,
  ScheduleHiddenDialog,
  type SchedItemInput,
  type SchedHiddenEntry,
} from "../ScheduleDialogs";

type Mode = ScheduleKind;

interface RItem {
  id: string;
  isCustom: boolean;
  edited: boolean;
  time: string;
  title: string;
  loc: string | null;
  type: string;
  crew: string;
  broll: boolean;
  star: boolean;
  sub: string;
  deliv: string[];
}
interface RDay {
  date: string;
  label: string;
  isCustomDay: boolean;
  items: RItem[];
}

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const builtinId = (kind: Mode, date: string, i: number) =>
  `${kind}:${date}:${i}`;
const dayHideId = (kind: Mode, date: string) => `dayhide:${kind}:${date}`;

function normBuiltin(it: ScheduleItem | MasterItem, kind: Mode): Omit<RItem, "id" | "isCustom" | "edited"> {
  if (kind === "shoots") {
    const s = it as ScheduleItem;
    return {
      time: s.time,
      title: s.title,
      loc: s.loc,
      type: s.type,
      crew: s.crew,
      broll: !!s.broll,
      star: false,
      sub: "",
      deliv: s.deliv ?? [],
    };
  }
  const m = it as MasterItem;
  return {
    time: m.time,
    title: m.title,
    loc: m.loc,
    type: "",
    crew: "",
    broll: !!m.broll,
    star: !!m.star,
    sub: m.sub ?? "",
    deliv: [],
  };
}

function normRow(r: ScheduleRow): Omit<RItem, "id" | "isCustom" | "edited"> {
  return {
    time: r.time ?? "",
    title: r.title ?? "",
    loc: r.loc ?? null,
    type: r.type ?? "shoot",
    crew: r.crew ?? "",
    broll: !!r.broll,
    star: !!r.star,
    sub: r.sub ?? "",
    deliv: Array.isArray(r.deliv) ? r.deliv : [],
  };
}

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

function builtinTitle(kind: Mode, id: string): string {
  const m = id.match(/^(shoots|master):(.+):(\d+)$/);
  if (!m) return "Item";
  const date = m[2];
  const idx = Number(m[3]);
  const src = kind === "shoots" ? SCHEDULE : MASTER;
  const day = src.find((d) => d.date === date);
  return day?.items[idx]?.title ?? "Item";
}

export function ScheduleTab({
  schedule,
  onOpenDeliverable,
}: {
  schedule: UseSchedule;
  onOpenDeliverable: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("shoots");
  const [brollOnly, setBrollOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([maxItemsDate(SCHEDULE)])
  );

  // Dialog state
  const [itemDialog, setItemDialog] = useState<{
    initial: SchedItemInput | null;
    id: string | null;
    isCustom: boolean;
    day: string;
    dayLabel: string;
  } | null>(null);
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [confirm, setConfirm] = useState<{
    kind: "item" | "day";
    id: string;
    title: string;
    isCustom: boolean;
    day: string;
    dayLabel: string;
    isCustomDay?: boolean;
  } | null>(null);

  useEffect(() => {
    const src = mode === "shoots" ? SCHEDULE : MASTER;
    const today = todayDate(src);
    setExpanded(new Set([today ?? maxItemsDate(src)]));
    setBrollOnly(false);
  }, [mode]);

  // ---- Merge built-in schedule with the Supabase overlay ----
  const { days, hiddenEntries } = useMemo(() => {
    const src = mode === "shoots" ? SCHEDULE : MASTER;
    const rowsArr = Object.values(schedule.rows).filter((r) => r.kind === mode);
    const byId = new Map(rowsArr.map((r) => [r.id, r]));
    const customItems = rowsArr.filter((r) => r.is_custom && !r.is_day);
    const customDays = rowsArr.filter((r) => r.is_custom && r.is_day);

    const builtinDays: RDay[] = src
      .map((day) => {
        const dayHide = byId.get(dayHideId(mode, day.date));
        if (dayHide?.hidden) return null;
        const items: RItem[] = [];
        day.items.forEach((it, i) => {
          const id = builtinId(mode, day.date, i);
          const row = byId.get(id);
          if (row?.hidden) return;
          const hasOverride = !!row && (row.title ?? "") !== "";
          const base = hasOverride
            ? normRow(row!)
            : normBuiltin(it, mode);
          items.push({ id, isCustom: false, edited: hasOverride, ...base });
        });
        customItems
          .filter((r) => r.day === day.date)
          .forEach((r) =>
            items.push({ id: r.id, isCustom: true, edited: false, ...normRow(r) })
          );
        items.sort((a, b) => parseTimeMin(a.time) - parseTimeMin(b.time));
        return {
          date: day.date,
          label: day.label,
          isCustomDay: false,
          items,
        };
      })
      .filter(Boolean) as RDay[];

    const extraDays: RDay[] = customDays
      .filter((r) => !r.hidden)
      .map((r) => {
        const items = customItems
          .filter((ci) => ci.day === r.day)
          .map((ci) => ({
            id: ci.id,
            isCustom: true,
            edited: false,
            ...normRow(ci),
          }))
          .sort((a, b) => parseTimeMin(a.time) - parseTimeMin(b.time));
        return {
          date: r.day,
          label: r.label ?? "New day",
          isCustomDay: true,
          items,
        };
      });

    // Hidden manager entries (current mode only)
    const hidden: SchedHiddenEntry[] = rowsArr
      .filter((r) => r.hidden)
      .map((r) => ({
        id: r.id,
        isDay: !!r.is_day,
        isCustom: !!r.is_custom,
        title: r.is_day
          ? r.label ?? r.day
          : r.is_custom
          ? r.title ?? "Item"
          : builtinTitle(mode, r.id),
      }));

    return { days: [...builtinDays, ...extraDays], hiddenEntries: hidden };
  }, [schedule.rows, mode]);

  // ---- Display filters (search + b-roll) ----
  const q = query.trim().toLowerCase();
  const matchItem = (it: RItem) =>
    [it.time, it.title, it.crew, it.sub, resolveLoc(it.loc)?.name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q);

  const displayDays = days
    .map((day) => {
      let items = day.items;
      if (mode === "master" && brollOnly) items = items.filter((i) => i.broll);
      if (q) items = items.filter(matchItem);
      return { ...day, items };
    })
    .filter((day) => {
      if (q || (mode === "master" && brollOnly)) return day.items.length > 0;
      return true;
    });

  const allDates = displayDays.map((d) => d.date);
  const isOpen = (date: string) => (q ? true : expanded.has(date));
  const toggle = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  // ---- Actions ----
  const fieldsFromInput = (v: SchedItemInput) => ({
    time: v.time,
    type: mode === "shoots" ? v.type : null,
    title: v.title,
    loc: v.loc,
    crew: mode === "shoots" ? v.crew : null,
    broll: v.broll,
    star: mode === "master" ? v.star : null,
    sub: mode === "master" ? v.sub : null,
    deliv: mode === "shoots" ? v.deliv : null,
  });

  const saveItem = (v: SchedItemInput) => {
    if (!itemDialog) return;
    const id = itemDialog.id ?? `si_${uuid()}`;
    schedule.upsertRow(id, {
      kind: mode,
      day: itemDialog.day,
      is_day: false,
      is_custom: itemDialog.id ? itemDialog.isCustom : true,
      hidden: false,
      ...fieldsFromInput(v),
    });
  };

  const doConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "item") {
      schedule.upsertRow(confirm.id, {
        kind: mode,
        day: confirm.day,
        is_day: false,
        hidden: true,
      });
    } else if (confirm.isCustomDay) {
      schedule.upsertRow(confirm.id, { kind: mode, day: confirm.id, is_day: true, hidden: true });
    } else {
      schedule.upsertRow(dayHideId(mode, confirm.day), {
        kind: mode,
        day: confirm.day,
        is_day: true,
        hidden: true,
        label: confirm.dayLabel,
      });
    }
  };

  const addDay = (label: string) => {
    const key = `cd_${uuid()}`;
    schedule.upsertRow(key, {
      kind: mode,
      day: key,
      is_day: true,
      is_custom: true,
      hidden: false,
      label,
    });
    setExpanded((prev) => new Set(prev).add(key));
  };

  const restore = (id: string) => {
    const row = schedule.rows[id];
    if (!row) return;
    const pureBuiltinHide =
      !row.is_custom && ((row.is_day) || (row.title ?? "") === "");
    if (pureBuiltinHide) schedule.deleteRow(id);
    else schedule.upsertRow(id, { hidden: false });
  };

  const itemToInput = (it: RItem): SchedItemInput => ({
    time: it.time,
    title: it.title,
    loc: it.loc,
    type: it.type || "shoot",
    crew: it.crew,
    broll: it.broll,
    star: it.star,
    sub: it.sub,
    deliv: it.deliv,
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
              expanded.size >= allDates.length ? new Set() : new Set(allDates)
            )
          }
          className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink/60 shadow-soft hover:text-ink"
        >
          {expanded.size >= allDates.length && allDates.length > 0
            ? "Collapse all"
            : "Expand all"}
        </button>
      </div>

      {/* Manage actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAddDayOpen(true)}
          data-testid="add-day-btn"
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-bold text-paper transition-colors hover:bg-ink/90"
        >
          <CalendarPlus size={16} /> Add day
        </button>
        {hiddenEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setHiddenOpen(true)}
            data-testid="schedule-hidden-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold text-ink/60 transition-colors hover:bg-ink/5"
          >
            <Archive size={15} /> Hidden ({hiddenEntries.length})
          </button>
        )}
      </div>

      {schedule.error && (
        <div className="rounded-lg bg-deadline/10 px-3 py-2 text-[12px] font-medium text-deadline">
          {schedule.error}
        </div>
      )}

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

      {displayDays.length === 0 ? (
        <EmptyState>No matching items.</EmptyState>
      ) : (
        <div className="space-y-2.5">
          {displayDays.map((day) => {
            const open = isOpen(day.date);
            const brollCount =
              mode === "master" ? day.items.filter((i) => i.broll).length : 0;
            const hasDeadline =
              mode === "shoots" &&
              day.items.some((i) => i.type === "deadline");
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
                    {day.isCustomDay && (
                      <span className="ml-2 rounded-full bg-crown/12 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-crown-deep">
                        Added
                      </span>
                    )}
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
                    {day.items.map((it) => (
                      <div key={it.id} className="rounded-lg bg-paper/50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[12px] font-bold tabular-nums text-crown-deep">
                            {it.time || "—"}
                          </span>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {mode === "shoots" && it.type && (
                              <TypeTag type={it.type} />
                            )}
                            {it.broll && <BrollTag />}
                            {mode === "master" && it.star && <StarTag />}
                            {it.isCustom && (
                              <span className="rounded-full bg-crown/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crown-deep">
                                Added
                              </span>
                            )}
                            {it.edited && (
                              <span className="rounded-full bg-crown/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crown-deep">
                                Edited
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setItemDialog({
                                  initial: itemToInput(it),
                                  id: it.id,
                                  isCustom: it.isCustom,
                                  day: day.date,
                                  dayLabel: day.label,
                                })
                              }
                              aria-label="Edit item"
                              data-testid={`edit-sched-${it.id}`}
                              className="grid h-7 w-7 place-items-center rounded-md text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  kind: "item",
                                  id: it.id,
                                  title: it.title,
                                  isCustom: it.isCustom,
                                  day: day.date,
                                  dayLabel: day.label,
                                })
                              }
                              aria-label="Delete item"
                              data-testid={`delete-sched-${it.id}`}
                              className="grid h-7 w-7 place-items-center rounded-md text-ink/40 transition-colors hover:bg-deadline/8 hover:text-deadline"
                            >
                              <Trash2 size={14} />
                            </button>
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
                        {mode === "shoots" && it.crew && (
                          <p className="mt-0.5 text-[12px] leading-snug text-ink/55">
                            {it.crew}
                          </p>
                        )}
                        {mode === "master" && it.sub && (
                          <p className="mt-1 text-[12px] italic leading-snug text-ink/55">
                            {it.sub}
                          </p>
                        )}
                        {mode === "shoots" && it.deliv.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {it.deliv.map((id) => {
                              const meta = findDeliverableMeta(id);
                              if (!meta) return null;
                              const multi = it.deliv.length > 1;
                              return (
                                <DeliverableLink
                                  key={id}
                                  label={
                                    multi ? meta.title : "View in Deliverables"
                                  }
                                  onClick={() => onOpenDeliverable(id)}
                                  testid={`schedule-view-deliverable-${id}`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Day footer actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setItemDialog({
                            initial: null,
                            id: null,
                            isCustom: true,
                            day: day.date,
                            dayLabel: day.label,
                          })
                        }
                        data-testid={`add-item-${day.date}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-ink/25 px-2.5 py-1.5 text-[12px] font-semibold text-ink/60 transition-colors hover:border-ink/40 hover:text-ink"
                      >
                        <Plus size={14} /> Add item
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            kind: "day",
                            id: day.date,
                            title: day.label,
                            isCustom: day.isCustomDay,
                            isCustomDay: day.isCustomDay,
                            day: day.date,
                            dayLabel: day.label,
                          })
                        }
                        data-testid={`delete-day-${day.date}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-ink/45 transition-colors hover:bg-deadline/8 hover:text-deadline"
                      >
                        <Trash2 size={14} /> Delete day
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {itemDialog && (
        <ScheduleItemDialog
          open
          kind={mode}
          initial={itemDialog.initial}
          dayLabel={itemDialog.dayLabel}
          onClose={() => setItemDialog(null)}
          onSave={saveItem}
        />
      )}

      <AddDayDialog
        open={addDayOpen}
        onClose={() => setAddDayOpen(false)}
        onCreate={addDay}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "day" ? "Delete this day?" : "Delete this item?"}
        message={
          <>
            <span className="font-semibold text-ink">{confirm?.title}</span> will
            be hidden for the whole crew. You can restore it any time from{" "}
            <span className="font-semibold text-ink">Hidden</span>.
          </>
        }
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={doConfirm}
      />

      <ScheduleHiddenDialog
        open={hiddenOpen}
        items={hiddenEntries}
        onClose={() => setHiddenOpen(false)}
        onRestore={restore}
        onPurge={(id) => schedule.deleteRow(id)}
      />
    </div>
  );
}
