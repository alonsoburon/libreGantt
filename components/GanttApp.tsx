"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Toolbar from "./Toolbar";
import TaskTable from "./TaskTable";
import GanttChart from "./GanttChart";
import TaskDialog from "./TaskDialog";
import RestartDialog from "./RestartDialog";
import { format, fromISO } from "@/lib/date-utils";

const TASK_LIST_W = 420;
const BASE_ROW_H = 36;
const BASE_FONT_PX = 14;

export default function GanttApp() {
  const fontScale = useStore((s) => s.fontScale);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [restartOpen, setRestartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  const rowHeight = Math.round(BASE_ROW_H * Math.max(1, fontScale));

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm font-mono">
        cargando…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontSize: `${BASE_FONT_PX * fontScale}px` }}
    >
      <Toolbar exportRef={exportRef} onRestartClick={() => setRestartOpen(true)} />

      <main className="flex-1 overflow-x-auto gantt-scroll">
        <div
          ref={exportRef}
          className="bg-paper relative"
          style={{ display: "inline-flex", flexDirection: "column", minWidth: "100%" }}
        >
          <ExportHeader />
          <div className="flex relative">
            <TaskTable rowHeight={rowHeight} width={TASK_LIST_W} onEdit={setEditingId} />
            <GanttChart rowHeight={rowHeight} onEdit={setEditingId} />
          </div>
          <ExportFooter />
        </div>
      </main>

      {editingId && <TaskDialog id={editingId} onClose={() => setEditingId(null)} />}
      {restartOpen && <RestartDialog onClose={() => setRestartOpen(false)} />}
    </div>
  );
}

function ExportHeader() {
  const project = useStore((s) => s.project);
  const tasks = useStore((s) => s.tasks);
  if (tasks.length === 0) {
    return null;
  }
  const minStart = tasks.reduce(
    (m, t) => (t.start < m ? t.start : m),
    tasks[0].start,
  );
  const maxEnd = tasks.reduce((m, t) => (t.end > m ? t.end : m), tasks[0].end);

  return (
    <div className="px-6 py-4 border-b border-paper-line bg-paper sticky left-0">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="font-display text-3xl italic leading-none">{project.name}</h1>
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
          {tasks.length} {tasks.length === 1 ? "tarea" : "tareas"}
        </span>
        <span className="text-xs font-mono text-ink-muted">
          {format(fromISO(minStart), "d MMM yyyy")} —{" "}
          {format(fromISO(maxEnd), "d MMM yyyy")}
        </span>
      </div>
      {project.description && (
        <p className="text-sm text-ink-soft mt-1 max-w-2xl">{project.description}</p>
      )}
    </div>
  );
}

function ExportFooter() {
  return (
    <div
      className="px-6 py-2 border-t border-paper-line text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono flex justify-between sticky left-0"
      data-no-export="false"
    >
      <span>Generado con gantt · local-first</span>
      <span>{new Date().toLocaleDateString()}</span>
    </div>
  );
}
