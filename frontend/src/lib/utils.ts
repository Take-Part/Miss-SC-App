import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LOCATIONS } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Google Maps deep link for a raw address string. */
export function mapsUrl(address: string): string {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address)
  );
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dowIndex(d: string): number {
  const i = DOW.indexOf(d);
  return i === -1 ? 99 : i;
}

/** Split a "Sun 6/14" style date into weekday + date parts. */
export function splitDate(date: string): { dow: string; md: string } {
  const parts = date.trim().split(/\s+/);
  if (parts.length >= 2) return { dow: parts[0], md: parts.slice(1).join(" ") };
  return { dow: date, md: "" };
}

/** Hard deadline if it mentions an 11:00 AM cutoff or a “night” turnaround. */
export function isHardDue(s: string | null | undefined): boolean {
  if (!s) return false;
  return /11:00\s*AM/i.test(s) || /night/i.test(s);
}
export function isTbdDue(s: string | null | undefined): boolean {
  if (!s) return false;
  return /TBD/i.test(s);
}

/** Resolve a deliverable/schedule `loc` (a LOCATIONS key or free text). */
export function resolveLoc(
  loc: string | null | undefined
): { name: string; addr: string; isTbd: boolean; mappable: boolean } | null {
  if (!loc) return null;
  const known = LOCATIONS[loc];
  if (known) {
    const isTbd = loc === "tbd";
    return {
      name: known.name,
      addr: known.addr,
      isTbd,
      mappable: !isTbd,
    };
  }
  // Free-text location (e.g. Master schedule “Marriott, 1450 Main St”)
  return { name: loc, addr: loc, isTbd: false, mappable: true };
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function telHref(phone: string): string {
  return "tel:" + phone.replace(/[^+0-9]/g, "");
}

/**
 * Find the schedule day matching the real current date (client clock).
 * Matches by month/day (e.g. today 6/14 -> the "Sun 6/14" entry).
 * Returns null if today is outside the event range.
 */
export function todayDate(days: { date: string }[]): string | null {
  const now = new Date();
  const md = `${now.getMonth() + 1}/${now.getDate()}`;
  const found = days.find((d) => splitDate(d.date).md === md);
  return found ? found.date : null;
}
