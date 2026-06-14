import { ShareInstall } from "./ShareInstall";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-card/60">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Desktop-only share + install block */}
        <div className="hidden sm:block">
          <ShareInstall />
        </div>
        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-ink/45 sm:mt-8">
          Built by Take Part Co · Times subject to change, do not print · Confirm
          TBDs with Morgan
        </p>
      </div>
    </footer>
  );
}
