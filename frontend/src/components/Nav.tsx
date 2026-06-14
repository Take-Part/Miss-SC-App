"use client";

import { useEffect, useState } from "react";
import {
  type LucideIcon,
  Clock,
  CalendarDays,
  Sparkles,
  Mic,
  Users,
  Crown,
  MapPin,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareInstall } from "./ShareInstall";

export type TabKey =
  | "today"
  | "schedule"
  | "deliverables"
  | "interviews"
  | "delegates"
  | "titleholders"
  | "contacts";

interface TabMeta {
  key: TabKey;
  label: string;
  Icon: LucideIcon;
  base: string; // jewel tone for tints / active fills
  bright: string; // lightened tone for icons on the dark menu
}

export const TABS: TabMeta[] = [
  { key: "today", label: "Today", Icon: Clock, base: "#b8902e", bright: "#e0b94e" },
  { key: "schedule", label: "Schedule", Icon: CalendarDays, base: "#2f6b54", bright: "#5aa888" },
  { key: "deliverables", label: "Deliverables", Icon: Sparkles, base: "#7c1d3f", bright: "#cf6188" },
  { key: "interviews", label: "Interviews", Icon: Mic, base: "#5a4a8a", bright: "#9484c8" },
  { key: "delegates", label: "Delegates", Icon: Users, base: "#a3331f", bright: "#dd7159" },
  { key: "titleholders", label: "Titleholders", Icon: Crown, base: "#9c5a86", bright: "#cd92b5" },
  { key: "contacts", label: "Contacts + Map", Icon: MapPin, base: "#2b6c79", bright: "#56a7b6" },
];

function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function Nav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeMeta = TABS.find((t) => t.key === active) ?? TABS[0];

  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-paper/92 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto max-w-3xl px-4">
        {/* Desktop horizontal tab bar */}
        <nav className="no-scrollbar hidden gap-0.5 overflow-x-auto py-1.5 sm:flex">
          {TABS.map((t) => {
            const on = t.key === active;
            const Icon = t.Icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange(t.key)}
                style={on ? { color: t.base } : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors",
                  on ? "" : "text-ink/55 hover:bg-ink/5 hover:text-ink"
                )}
              >
                <Icon size={15} strokeWidth={2.1} className={on ? "" : "opacity-60"} />
                {t.label}
                {on && (
                  <span
                    style={{ backgroundColor: t.base }}
                    className="absolute inset-x-2.5 -bottom-[7px] h-0.5 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile slim bar */}
        <div className="flex items-center justify-between py-2.5 sm:hidden">
          <span className="flex items-center gap-2">
            <span style={{ color: activeMeta.base }}>
              <activeMeta.Icon size={18} strokeWidth={2.2} />
            </span>
            <span className="font-serif text-[17px] font-semibold text-ink">
              {activeMeta.label}
            </span>
          </span>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink/80 hover:bg-ink/5"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Mobile fancy slide-down menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <div
            className="absolute inset-x-0 top-0 flex max-h-[94vh] flex-col overflow-hidden rounded-b-3xl animate-slide-down"
            style={{
              background:
                "radial-gradient(135% 90% at 50% -20%, #2d2016 0%, #1b130d 48%, #110b07 100%)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <div className="flex items-center gap-2.5">
                <Crown size={20} strokeWidth={2} style={{ color: "#e0b94e" }} />
                <span className="text-[15px] font-bold uppercase tracking-[0.22em] text-[#e7c873]">
                  Crew Sheet
                </span>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-[#efe7d6]/80 transition-colors hover:bg-white/5"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-[#d8ad45]/35 to-transparent" />

            {/* Scrollable body */}
            <div className="safe-bottom flex-1 overflow-y-auto px-3 py-4">
              <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d8ad45]/80">
                Jump to
              </p>
              <nav className="space-y-1">
                {TABS.map((t) => {
                  const on = t.key === active;
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        onChange(t.key);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left transition-all"
                      style={
                        on
                          ? {
                              backgroundColor: rgba(t.base, 0.2),
                              boxShadow: `inset 0 0 0 1px ${rgba(
                                t.base,
                                0.38
                              )}, 0 10px 30px ${rgba(t.base, 0.24)}`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform"
                        style={
                          on
                            ? { backgroundColor: t.base, color: "#fff" }
                            : {
                                backgroundColor: rgba(t.base, 0.16),
                                color: t.bright,
                              }
                        }
                      >
                        <Icon size={20} strokeWidth={2} />
                      </span>
                      <span
                        className={cn(
                          "text-[16px]",
                          on
                            ? "font-bold text-white"
                            : "font-semibold text-[#efe7d6]/85"
                        )}
                      >
                        {t.label}
                      </span>
                      {on && (
                        <span
                          className="ml-auto h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.bright }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="my-4 h-px bg-white/10" />

              <div className="px-2 pb-2">
                <ShareInstall variant="dark" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
