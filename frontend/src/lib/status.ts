// The four live states every deliverable / social cut can be in.
export const STATUSES = [
  "not_started",
  "filming",
  "editing",
  "delivered",
] as const;

export type StatusValue = (typeof STATUSES)[number];

export const DEFAULT_STATUS: StatusValue = "not_started";

export interface StatusMeta {
  value: StatusValue;
  label: string;
  short: string;
  // tailwind class fragments for the active chip
  activeBg: string;
  activeText: string;
  dot: string;
}

export const STATUS_META: Record<StatusValue, StatusMeta> = {
  not_started: {
    value: "not_started",
    label: "Not started",
    short: "Not started",
    activeBg: "bg-ink/85",
    activeText: "text-paper",
    dot: "bg-ink/40",
  },
  filming: {
    value: "filming",
    label: "Filming",
    short: "Filming",
    activeBg: "bg-shoot",
    activeText: "text-white",
    dot: "bg-shoot",
  },
  editing: {
    value: "editing",
    label: "Editing",
    short: "Editing",
    activeBg: "bg-crown",
    activeText: "text-white",
    dot: "bg-crown",
  },
  delivered: {
    value: "delivered",
    label: "Delivered",
    short: "Delivered",
    activeBg: "bg-sash",
    activeText: "text-white",
    dot: "bg-sash",
  },
};

export interface StatusLink {
  label: string;
  url: string;
}

export interface StatusRow {
  id: string;
  status: StatusValue;
  updated_at: string;
  updated_by: string | null;
  // ---- editable content overrides (null/absent => fall back to data.ts) ----
  title?: string | null;
  notes?: string | null;
  loc?: string | null;
  due?: string | null;
  links?: StatusLink[] | null;
  delivered_link?: string | null;
}

export function isValidStatus(v: unknown): v is StatusValue {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}
