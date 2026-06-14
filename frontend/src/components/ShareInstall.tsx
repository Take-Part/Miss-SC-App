"use client";

import { useEffect, useState } from "react";
import { APP_URL } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ShareInstall() {
  const [url, setUrl] = useState<string>(APP_URL);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");

  useEffect(() => {
    try {
      const host = window.location.hostname;
      const isLocal =
        host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
      setUrl(isLocal ? APP_URL : window.location.href);
      if (/android/i.test(navigator.userAgent)) setPlatform("android");
    } catch {
      /* keep APP_URL fallback */
    }
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // legacy fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">
          Share this app
        </p>
        <div className="mt-1.5 flex gap-2">
          <input
            readOnly
            suppressHydrationWarning
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 truncate rounded-lg border border-line bg-paper/60 px-3 py-2 text-[13px] text-ink/70 outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className={cn(
              "shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors",
              copied
                ? "bg-shoot text-white"
                : "bg-ink text-paper hover:bg-ink/90"
            )}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">
            Add to Home Screen
          </p>
          <div className="inline-flex rounded-full border border-line bg-paper/60 p-0.5">
            {(["ios", "android"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold transition-colors",
                  platform === p
                    ? "bg-ink text-paper"
                    : "text-ink/50 hover:text-ink"
                )}
              >
                {p === "ios" ? "iPhone" : "Android"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink/60">
          {platform === "ios" ? (
            <>
              In <span className="font-semibold text-ink/75">Safari</span>, tap the{" "}
              <span className="font-semibold text-ink/75">Share</span> icon →{" "}
              <span className="font-semibold text-ink/75">Add to Home Screen</span>.
            </>
          ) : (
            <>
              In <span className="font-semibold text-ink/75">Chrome</span>, tap the{" "}
              <span className="font-semibold text-ink/75">⋮</span> menu →{" "}
              <span className="font-semibold text-ink/75">Add to Home screen</span>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
