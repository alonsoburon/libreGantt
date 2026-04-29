"use client";

import clsx from "clsx";
import { useLang } from "@/lib/i18n";

export default function LanguageSwitch() {
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);

  return (
    <div
      className="fixed bottom-3 left-3 z-40 flex items-center gap-0.5 p-0.5 bg-paper/90 backdrop-blur-md border border-paper-line rounded-md shadow-paper"
      data-no-export="true"
    >
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={clsx(
            "px-2 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition",
            lang === l
              ? "bg-ink text-paper"
              : "text-ink-muted hover:text-ink",
          )}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
