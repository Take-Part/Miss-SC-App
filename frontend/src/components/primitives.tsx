"use client";

import { Clapperboard, ArrowUpRight } from "lucide-react";
import { cn, mapsUrl, resolveLoc, isHardDue, isTbdDue } from "@/lib/utils";
import type { RefLink } from "@/lib/data";

/* ---------- Type tag (shoot / deadline / event / logistics) ---------- */

const TYPE_STYLES: Record<string, string> = {
  shoot: "bg-shoot/12 text-shoot ring-shoot/20",
  deadline: "bg-deadline/12 text-deadline ring-deadline/25",
  event: "bg-event/12 text-event ring-event/20",
  logistics: "bg-ink/8 text-ink/70 ring-ink/15",
};

export function TypeTag({ type }: { type: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        TYPE_STYLES[type] ?? TYPE_STYLES.logistics
      )}
    >
      {type}
    </span>
  );
}

export function BrollTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-shoot px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white">
      B-roll
    </span>
  );
}

export function StarTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-event px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white">
      Star
    </span>
  );
}

export function VideoSocialTag({ kind }: { kind: "video" | "social" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        kind === "video"
          ? "bg-sash/10 text-sash ring-sash/20"
          : "bg-crown/12 text-crown-deep ring-crown/25"
      )}
    >
      {kind}
    </span>
  );
}

/* ---------- Due chip ---------- */

export function DueChip({
  due,
  prefix = "Due:",
}: {
  due: string;
  prefix?: string;
}) {
  const hard = isHardDue(due);
  const tbd = isTbdDue(due);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        hard
          ? "bg-deadline/10 text-deadline"
          : tbd
          ? "bg-ink/5 text-ink/45 italic"
          : "bg-ink/6 text-ink/70"
      )}
    >
      <span className="font-semibold not-italic">{prefix}</span>
      {due}
    </span>
  );
}

/* ---------- Cross-link to a deliverable (Today / Schedule -> Deliverables) ---------- */

export function DeliverableLink({
  label,
  onClick,
  testid,
}: {
  label: string;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-sash/25 bg-sash/8 px-2.5 py-1 text-[12px] font-semibold text-sash transition-colors hover:bg-sash/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sash/35 active:bg-sash/20"
    >
      <Clapperboard size={13} className="shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      <ArrowUpRight size={13} className="shrink-0" aria-hidden />
    </button>
  );
}

/* ---------- Location link ---------- */

export function MapLink({
  loc,
  className,
}: {
  loc: string | null | undefined;
  className?: string;
}) {
  const r = resolveLoc(loc);
  if (!r) return null;
  if (!r.mappable || r.isTbd) {
    return (
      <span className={cn("text-ink/45", className)}>
        <span aria-hidden>📍</span> {r.name}
      </span>
    );
  }
  return (
    <a
      href={mapsUrl(r.addr)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-0.5 text-ink/70 underline decoration-line decoration-1 underline-offset-2 transition-colors hover:text-sash hover:decoration-sash",
        className
      )}
    >
      <span aria-hidden>📍</span>
      <span>{r.name}</span>
    </a>
  );
}

/* ---------- Reference link chips ---------- */

export function RefChips({ links }: { links?: RefLink[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-paper/60 px-2.5 py-1 text-xs font-medium text-crown-deep transition-colors hover:border-crown/50 hover:bg-crown/5"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {l.label}
        </a>
      ))}
    </div>
  );
}

/* ---------- Section heading ---------- */

export function SectionTitle({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="font-serif text-base font-semibold text-ink">{children}</h2>
      {typeof count === "number" && (
        <span className="text-xs font-medium text-ink/40">{count}</span>
      )}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ---------- Quick search box ---------- */

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="m20 20-3-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-9 text-sm text-ink shadow-soft outline-none transition focus:border-crown/50 focus:ring-2 focus:ring-crown/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink/70"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ---------- Pill toggle group ---------- */

export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-card p-0.5 shadow-soft">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full font-semibold transition-all",
              size === "sm"
                ? "px-3 py-1 text-xs"
                : "px-3.5 py-1.5 text-[13px]",
              active
                ? "bg-ink text-paper shadow-sm"
                : "text-ink/55 hover:text-ink"
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  active ? "text-paper/60" : "text-ink/35"
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Day chip (filter) ---------- */

export function DayChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
        active
          ? "border-crown bg-crown text-white shadow-sm"
          : "border-line bg-card text-ink/65 hover:border-crown/40 hover:text-ink"
      )}
    >
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "tabular-nums text-[11px]",
            active ? "text-white/70" : "text-ink/35"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card/50 px-4 py-10 text-center text-sm text-ink/45">
      {children}
    </div>
  );
}
