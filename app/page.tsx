"use client";

import dynamic from "next/dynamic";

const GanttApp = dynamic(() => import("@/components/GanttApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm font-mono">
      cargando…
    </div>
  ),
});

export default function Page() {
  return <GanttApp />;
}
