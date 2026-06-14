import { BRAND_LINK } from "@/lib/data";

export function Masthead() {
  return (
    <header className="border-b border-line bg-card/70">
      <div className="mx-auto max-w-3xl px-4 pb-3 pt-4 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sash">
              Take Part Co · Run of Show
            </p>
            <h1 className="mt-1 font-serif text-[26px] leading-tight text-ink sm:text-3xl">
              Miss South Carolina CY26
            </h1>
            <p className="mt-1 text-[12.5px] leading-snug text-ink/55">
              89th Year · Competition Week June 14–21 · Columbia, SC
            </p>
          </div>
          <a
            href={BRAND_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-crown/40 bg-crown/5 px-3 py-1.5 text-[12px] font-semibold text-crown-deep shadow-soft transition-colors hover:bg-crown/10"
          >
            Brand Elements
          </a>
        </div>
      </div>
    </header>
  );
}
