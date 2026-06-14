import { TITLEHOLDERS } from "@/lib/data";

export function TitleholdersTab() {
  return (
    <div className="space-y-4">
      {TITLEHOLDERS.map((t) => (
        <article
          key={t.name}
          className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft"
        >
          <div className="flex gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.photo}
              alt={t.name}
              className="h-24 w-24 shrink-0 rounded-xl object-cover ring-1 ring-line"
            />
            <div className="min-w-0">
              <h3 className="font-serif text-[18px] font-semibold leading-tight text-ink">
                {t.name}
              </h3>
              <p className="mt-0.5 text-[12.5px] font-semibold text-crown-deep">
                {t.title}
              </p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <p className="text-[13px] leading-relaxed text-ink/70">{t.blurb}</p>
            <a
              href={t.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-sash underline decoration-sash/30 underline-offset-2 hover:decoration-sash"
            >
              Official page
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M7 17 17 7M9 7h8v8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
