"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";
import { DELIVERABLES, SOCIALS } from "@/lib/data";
import type { ScheduleKind } from "@/lib/useSchedule";

const inputCls =
  "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2 text-[14px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-crown/50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
        {label}
      </span>
      {children}
    </label>
  );
}

const DELIV_OPTIONS: { id: string; title: string }[] = [
  ...DELIVERABLES.map((d) => ({ id: d.id, title: d.title })),
  ...SOCIALS.map((s) => ({ id: s.id, title: s.title })),
];

const TYPE_OPTIONS = [
  { value: "shoot", label: "Shoot" },
  { value: "deadline", label: "Deadline" },
  { value: "event", label: "Event" },
  { value: "logistics", label: "Logistics" },
];

export interface SchedItemInput {
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

export const EMPTY_ITEM: SchedItemInput = {
  time: "",
  title: "",
  loc: null,
  type: "shoot",
  crew: "",
  broll: false,
  star: false,
  sub: "",
  deliv: [],
};

/* ---------- Add / edit a schedule item ---------- */

export function ScheduleItemDialog({
  open,
  kind,
  initial,
  dayLabel,
  onClose,
  onSave,
}: {
  open: boolean;
  kind: ScheduleKind;
  initial: SchedItemInput | null;
  dayLabel: string;
  onClose: () => void;
  onSave: (v: SchedItemInput) => void;
}) {
  const [v, setV] = useState<SchedItemInput>(EMPTY_ITEM);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setV(initial ?? EMPTY_ITEM);
      setTouched(false);
    }
  }, [open, initial]);

  const set = <K extends keyof SchedItemInput>(k: K, val: SchedItemInput[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const valid = v.title.trim().length > 0;
  const save = () => {
    setTouched(true);
    if (!valid) return;
    onSave({
      ...v,
      title: v.title.trim(),
      time: v.time.trim(),
      loc: v.loc && v.loc.trim() ? v.loc.trim() : null,
      crew: v.crew.trim(),
      sub: v.sub.trim(),
    });
    onClose();
  };

  const toggleDeliv = (id: string) =>
    set(
      "deliv",
      v.deliv.includes(id)
        ? v.deliv.filter((x) => x !== id)
        : [...v.deliv, id]
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit item" : "Add to schedule"}
      subtitle={dayLabel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink/60 hover:bg-ink/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!valid}
            data-testid="schedule-item-save"
            className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {initial ? "Save" : "Add"}
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-[7rem_1fr] gap-2">
          <Field label="Time">
            <input
              value={v.time}
              onChange={(e) => set("time", e.target.value)}
              placeholder="8:00 AM"
              className={inputCls}
            />
          </Field>
          <Field label="Title">
            <input
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What's happening"
              data-testid="schedule-item-title"
              className={cn(
                inputCls,
                touched && !valid && "border-deadline/60 focus:border-deadline/60"
              )}
            />
          </Field>
        </div>
        {touched && !valid && (
          <span className="block text-[11.5px] font-medium text-deadline">
            A title is required.
          </span>
        )}

        <Field label="Location">
          <input
            value={v.loc ?? ""}
            onChange={(e) => set("loc", e.target.value)}
            placeholder="e.g. Township Auditorium"
            className={inputCls}
          />
        </Field>

        {kind === "shoots" ? (
          <>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                Type
              </span>
              <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-xl bg-ink/5 p-1">
                {TYPE_OPTIONS.map((o) => {
                  const active = o.value === v.type;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set("type", o.value)}
                      className={cn(
                        "rounded-lg px-1 py-1.5 text-[11.5px] font-semibold transition-colors",
                        active
                          ? "bg-ink text-paper shadow-sm"
                          : "text-ink/55 hover:bg-card"
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Crew note">
              <textarea
                value={v.crew}
                onChange={(e) => set("crew", e.target.value)}
                rows={2}
                className={cn(inputCls, "resize-y")}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink/75">
              <input
                type="checkbox"
                checked={v.broll}
                onChange={(e) => set("broll", e.target.checked)}
                className="h-4 w-4 rounded border-line accent-shoot"
              />
              B-roll window
            </label>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
                Linked deliverables
              </span>
              <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
                {DELIV_OPTIONS.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-[12.5px] text-ink/75 hover:bg-ink/5"
                  >
                    <input
                      type="checkbox"
                      checked={v.deliv.includes(o.id)}
                      onChange={() => toggleDeliv(o.id)}
                      className="h-3.5 w-3.5 rounded border-line accent-sash"
                    />
                    <span className="truncate">{o.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink/75">
                <input
                  type="checkbox"
                  checked={v.broll}
                  onChange={(e) => set("broll", e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-shoot"
                />
                B-roll
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink/75">
                <input
                  type="checkbox"
                  checked={v.star}
                  onChange={(e) => set("star", e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-event"
                />
                Star moment
              </label>
            </div>
            <Field label="Sub-note">
              <input
                value={v.sub}
                onChange={(e) => set("sub", e.target.value)}
                className={inputCls}
              />
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ---------- Add a whole day ---------- */

export function AddDayDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (label: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (open) {
      setLabel("");
      setTouched(false);
    }
  }, [open]);
  const valid = label.trim().length > 0;
  const create = () => {
    setTouched(true);
    if (!valid) return;
    onCreate(label.trim());
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a day"
      subtitle="Create a new collapsible day section."
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink/60 hover:bg-ink/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={create}
            disabled={!valid}
            data-testid="add-day-submit"
            className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-paper hover:bg-ink/90 disabled:opacity-40"
          >
            Create
          </button>
        </div>
      }
    >
      <Field label="Day name">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Sunday, June 21 — WRAP"
          data-testid="add-day-label"
          className={cn(
            inputCls,
            touched && !valid && "border-deadline/60 focus:border-deadline/60"
          )}
        />
      </Field>
    </Modal>
  );
}

/* ---------- Hidden schedule items / days manager ---------- */

export interface SchedHiddenEntry {
  id: string;
  title: string;
  isDay: boolean;
  isCustom: boolean;
}

export function ScheduleHiddenDialog({
  open,
  items,
  onClose,
  onRestore,
  onPurge,
}: {
  open: boolean;
  items: SchedHiddenEntry[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hidden schedule items"
      subtitle="Restore to bring it back for the whole crew."
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink/45">
          Nothing is hidden right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              data-testid={`sched-hidden-${it.id}`}
              className="flex items-center gap-2 rounded-xl border border-line bg-paper/40 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">
                  {it.title}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-ink/40">
                  {it.isDay ? "whole day" : "item"}
                  {it.isCustom ? " · added in-app" : " · built-in"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRestore(it.id)}
                data-testid={`sched-restore-${it.id}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-shoot/30 bg-shoot/8 px-2.5 py-1.5 text-[12px] font-semibold text-shoot hover:bg-shoot/15"
              >
                <RotateCcw size={13} /> Restore
              </button>
              {it.isCustom && (
                <button
                  type="button"
                  onClick={() => onPurge(it.id)}
                  aria-label="Delete permanently"
                  data-testid={`sched-purge-${it.id}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-ink/40 hover:border-deadline/40 hover:text-deadline"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
