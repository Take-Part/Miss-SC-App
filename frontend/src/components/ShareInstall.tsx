"use client";

import { useEffect, useState } from "react";
import { APP_URL } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ShareInstall({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";
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

  const steps =
    platform === "ios"
      ? [
          "Open this page in Safari.",
          "Tap the Share icon (square with an up-arrow).",
          "Scroll down and tap Add to Home Screen, then Add.",
        ]
      : [
          "Open this page in Chrome.",
          "Tap the ⋮ menu (top-right).",
          "Tap Add to Home screen, then Add.",
        ];

  const goldGradient = { background: "linear-gradient(180deg,#e6bd55,#c89a32)" };

  return (
    <div className="space-y-4">
      {/* Share */}
      <div>
        <p
          className={cn(
            "text-[11px] font-bold uppercase tracking-wider",
            dark ? "text-[#d8ad45]" : "text-ink/45"
          )}
        >
          Share this app
        </p>
        <div className="mt-1.5 flex gap-2">
          <input
            readOnly
            suppressHydrationWarning
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              "min-w-0 flex-1 truncate rounded-lg border px-3 py-2 text-[13px] outline-none",
              dark
                ? "border-white/10 bg-black/30 text-[#efe7d6]"
                : "border-line bg-paper/60 text-ink/70"
            )}
          />
          <button
            type="button"
            onClick={copy}
            style={!copied && dark ? goldGradient : undefined}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-[13px] font-bold transition-colors",
              copied
                ? "bg-shoot text-white"
                : dark
                ? "text-[#1a120c]"
                : "bg-ink text-paper hover:bg-ink/90"
            )}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Install */}
      <div>
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-wider",
              dark ? "text-[#d8ad45]" : "text-ink/45"
            )}
          >
            Add to Home Screen
          </p>
          <div
            className={cn(
              "inline-flex rounded-full border p-0.5",
              dark ? "border-white/10 bg-black/30" : "border-line bg-paper/60"
            )}
          >
            {(["ios", "android"] as const).map((p) => {
              const on = platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  style={on && dark ? goldGradient : undefined}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11.5px] font-bold transition-colors",
                    on
                      ? dark
                        ? "text-[#1a120c]"
                        : "bg-ink text-paper"
                      : dark
                      ? "text-[#efe7d6]/55"
                      : "text-ink/50 hover:text-ink"
                  )}
                >
                  {p === "ios" ? "iPhone" : "Android"}
                </button>
              );
            })}
          </div>
        </div>
        <ol className="mt-2.5 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold",
                  dark
                    ? "bg-[#d8ad45]/20 text-[#e7c873]"
                    : "bg-crown/15 text-crown-deep"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-[12.5px] leading-relaxed",
                  dark ? "text-[#efe7d6]/75" : "text-ink/65"
                )}
              >
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
