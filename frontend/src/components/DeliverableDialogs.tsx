"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Link2 } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";
import type { StatusLink } from "@/lib/status";

export interface EditableItem {
  id: string;
  kind: "video" | "social";
  title: string;
  notes: string;
  loc: string | null;
  due: string;
  links?: StatusLink[];
}

export interface CurrentValues {
  title: string;
  notes: string;
  locText: string;
  due: string;
  links: StatusLink[];
}

export interface EditPartial {
  title: string | null;
  notes: string | null;
  loc: string | null;
  due: string | null;
  links: StatusLink[] | null;
}

const inputCls =
  "mt-1 w-full rounded-lg border border-line bg-paper/50 px-3 py-2 text-[14px] text-ink outline-none transition focus:border-crown/50 focus:ring-2 focus:ring-crown/15";

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

export function EditDialog({
  open,
  item,
  current,
  onClose,
  onSave,
  onReset,
}: {
  open: boolean;
  item: EditableItem;
  current: CurrentValues;
  onClose: () => void;
  onSave: (partial: EditPartial) => void;
  onReset: () => void;
}) {
  const [title, setTitle] = useState(current.title);
  const [notes, setNotes] = useState(current.notes);
  const [locText, setLocText] = useState(current.locText);
  const [due, setDue] = useState(current.due);
  const [links, setLinks] = useState<StatusLink[]>(current.links);

  useEffect(() => {
    if (open) {
      setTitle(current.title);
      setNotes(current.notes);
      setLocText(current.locText);
      setDue(current.due);
      setLinks(current.links.length ? current.links : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item.id]);

  const save = () => {
    const cleaned = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label || l.url);
    onSave({
      title: title.trim() || null,
      notes: notes.trim() || null,
      loc: locText.trim() || null,
      due: due.trim() || null,
      links: cleaned.length ? cleaned : null,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit deliverable"
      subtitle="Edits sync to the whole crew. Blank a field to restore the original."
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="text-[12.5px] font-semibold text-ink/45 transition-colors hover:text-deadline"
          >
            Reset to original
          </button>
          <div className="flex gap-2">
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
              className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-paper hover:bg-ink/90"
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={cn(inputCls, "resize-y")}
          />
        </Field>
        <Field label="Location">
          <input
            value={locText}
            onChange={(e) => setLocText(e.target.value)}
            placeholder="e.g. Township Auditorium"
            className={inputCls}
          />
        </Field>
        <Field label="Due">
          <input
            value={due}
            onChange={(e) => setDue(e.target.value)}
            placeholder="e.g. Tue 6/16, 11:00 AM"
            className={inputCls}
          />
        </Field>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink/45">
              Example links
            </span>
            <button
              type="button"
              onClick={() => setLinks((p) => [...p, { label: "", url: "" }])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-crown-deep hover:text-crown"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="mt-1.5 space-y-2">
            {links.length === 0 && (
              <p className="text-[12px] italic text-ink/35">No links yet.</p>
            )}
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={l.label}
                  onChange={(e) =>
                    setLinks((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Label"
                  className={cn(inputCls, "mt-0 w-28 shrink-0")}
                />
                <input
                  value={l.url}
                  onChange={(e) =>
                    setLinks((p) =>
                      p.map((x, j) =>
                        j === i ? { ...x, url: e.target.value } : x
                      )
                    )
                  }
                  placeholder="https://…"
                  className={cn(inputCls, "mt-0 min-w-0 flex-1")}
                />
                <button
                  type="button"
                  onClick={() => setLinks((p) => p.filter((_, j) => j !== i))}
                  aria-label="Remove link"
                  className="grid w-9 shrink-0 place-items-center rounded-lg border border-line text-ink/40 hover:border-deadline/40 hover:text-deadline"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function DeliveredDialog({
  open,
  phase,
  title,
  currentLink,
  onClose,
  onConfirm,
  onSaveLink,
}: {
  open: boolean;
  phase: "confirm" | "link";
  title: string;
  currentLink: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onSaveLink: (link: string) => void;
}) {
  const [local, setLocal] = useState<"confirm" | "link">(phase);
  const [link, setLink] = useState(currentLink ?? "");

  useEffect(() => {
    if (open) {
      setLocal(phase);
      setLink(currentLink ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={local === "confirm" ? "Mark as delivered?" : "Delivery link"}
      subtitle={
        local === "confirm"
          ? undefined
          : "Paste the final link so the team can grab the asset."
      }
      footer={
        local === "confirm" ? (
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
              onClick={() => {
                onConfirm();
                setLocal("link");
              }}
              className="rounded-lg bg-sash px-4 py-2 text-[13px] font-bold text-white hover:bg-sash/90"
            >
              Yes, delivered
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink/60 hover:bg-ink/5"
            >
              {currentLink ? "Cancel" : "Skip"}
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveLink(link.trim());
                onClose();
              }}
              className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-paper hover:bg-ink/90"
            >
              Save link
            </button>
          </div>
        )
      }
    >
      {local === "confirm" ? (
        <div className="text-[13.5px] leading-relaxed text-ink/75">
          <p>
            Are you sure{" "}
            <span className="font-semibold text-ink">“{title}”</span> is
            delivered?
          </p>
          <p className="mt-2 text-ink/55">
            You’ll add the delivery link next so anyone can grab it.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-paper/50 px-3 py-2 focus-within:border-crown/50 focus-within:ring-2 focus-within:ring-crown/15">
            <Link2 size={16} className="shrink-0 text-ink/40" />
            <input
              autoFocus
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://drive.google.com/…"
              inputMode="url"
              className="w-full bg-transparent text-[14px] text-ink outline-none"
            />
          </div>
          <p className="mt-2 text-[12px] text-ink/45">
            Tip: paste a Google Drive, Frame.io, or Dropbox link.
          </p>
        </div>
      )}
    </Modal>
  );
}
