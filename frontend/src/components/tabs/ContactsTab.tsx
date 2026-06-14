import { CONTACTS, LOCATIONS } from "@/lib/data";
import { mapsUrl, telHref } from "@/lib/utils";
import { SectionTitle } from "../primitives";

function isTbdPhone(phone: string) {
  return /TBD/i.test(phone);
}

export function ContactsTab() {
  const locationEntries = Object.entries(LOCATIONS).filter(
    ([key]) => key !== "tbd"
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle count={CONTACTS.length}>Contacts</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
          {CONTACTS.map((c, i) => {
            const tbd = isTbdPhone(c.phone);
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold leading-snug text-ink">
                    {c.name}
                  </p>
                  <p className="text-[12px] leading-snug text-ink/55">
                    {c.role}
                  </p>
                </div>
                {tbd ? (
                  <span className="shrink-0 text-[13px] italic text-ink/35">
                    {c.phone}
                  </span>
                ) : (
                  <a
                    href={telHref(c.phone)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-shoot/25 bg-shoot/5 px-3 py-1.5 text-[12.5px] font-semibold text-shoot transition-colors hover:bg-shoot/10"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6.6 10.8a13.5 13.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.4.54 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.3a1 1 0 0 1 1 1 11 11 0 0 0 .54 3.4 1 1 0 0 1-.24 1Z"
                        fill="currentColor"
                      />
                    </svg>
                    {c.phone}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle count={locationEntries.length}>Locations</SectionTitle>
        <div className="space-y-2.5">
          {locationEntries.map(([key, loc]) => (
            <div
              key={key}
              className="rounded-2xl border border-line bg-card p-4 shadow-soft"
            >
              <h3 className="font-serif text-[15.5px] font-semibold leading-snug text-ink">
                {loc.name}
              </h3>
              <a
                href={mapsUrl(loc.addr)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-ink/70 underline decoration-line decoration-1 underline-offset-2 hover:text-sash hover:decoration-sash"
              >
                <span aria-hidden>📍</span>
                {loc.addr}
              </a>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">
                {loc.note}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
