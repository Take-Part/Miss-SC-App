"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ShareInstall } from "./ShareInstall";

export const TABS = [
  { key: "today", label: "Today" },
  { key: "schedule", label: "Schedule" },
  { key: "deliverables", label: "Deliverables" },
  { key: "interviews", label: "Interviews" },
  { key: "delegates", label: "Delegates" },
  { key: "titleholders", label: "Titleholders" },
  { key: "contacts", label: "Contacts + Map" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function Nav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel = TABS.find((t) => t.key === active)?.label ?? "";

  // Lock body scroll while the mobile menu is open.
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
        <nav className="hidden gap-1 py-1.5 sm:flex">
          {TABS.map((t) => {
            const on = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange(t.key)}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                  on
                    ? "text-sash"
                    : "text-ink/55 hover:bg-ink/5 hover:text-ink"
                )}
              >
                {t.label}
                {on && (
                  <span className="absolute inset-x-3 -bottom-[7px] h-0.5 rounded-full bg-sash" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile slim bar */}
        <div className="flex items-center justify-between py-2.5 sm:hidden">
          <span className="font-serif text-[17px] font-semibold text-ink">
            {activeLabel}
          </span>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="-mr-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink/80 hover:bg-ink/5"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/35"
          />
          <div className="absolute inset-x-0 top-0 max-h-[90vh] overflow-y-auto rounded-b-2xl border-b border-line bg-card shadow-lift animate-slide-down">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sash">
                Take Part Co Crew
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink/70 hover:bg-ink/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <nav className="p-2">
              {TABS.map((t) => {
                const on = t.key === active;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      onChange(t.key);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-[15px] font-semibold transition-colors",
                      on
                        ? "bg-sash/10 text-sash"
                        : "text-ink/75 hover:bg-ink/5"
                    )}
                  >
                    {t.label}
                    {on && (
                      <span className="h-2 w-2 rounded-full bg-sash" />
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="safe-bottom border-t border-line p-4">
              <ShareInstall />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
