"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import Toolbar from "./Toolbar";
import TaskTable from "./TaskTable";
import GanttChart from "./GanttChart";
import TaskDialog from "./TaskDialog";
import RestartDialog from "./RestartDialog";
import { format, fromISO } from "@/lib/date-utils";

const TASK_LIST_DEFAULT = 420;
const TASK_LIST_MIN = 240;
const TASK_LIST_MAX = 900;
const TASK_LIST_W_KEY = "gantt-task-list-w";
const BASE_ROW_H = 36;
const BASE_FONT_PX = 14;

export default function GanttApp() {
  const fontScale = useStore((s) => s.fontScale);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [restartOpen, setRestartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [taskListW, setTaskListW] = useState(TASK_LIST_DEFAULT);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(TASK_LIST_W_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n)) setTaskListW(clampTaskListW(n));
    }
  }, []);

  const updateTaskListW = (w: number) => {
    const next = clampTaskListW(w);
    setTaskListW(next);
    localStorage.setItem(TASK_LIST_W_KEY, String(next));
  };

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
            <TaskTable rowHeight={rowHeight} width={taskListW} onEdit={setEditingId} />
            <ResizeHandle width={taskListW} setWidth={updateTaskListW} />
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
  const setProject = useStore((s) => s.setProject);
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
      <input
        value={project.description ?? ""}
        onChange={(e) => setProject({ description: e.target.value })}
        placeholder="Descripción del proyecto…"
        className="mt-1 w-full max-w-2xl bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-0 text-sm text-ink-soft placeholder:text-ink-muted/60"
      />
    </div>
  );
}

function clampTaskListW(w: number): number {
  return Math.max(TASK_LIST_MIN, Math.min(TASK_LIST_MAX, Math.round(w)));
}

function ResizeHandle({
  width,
  setWidth,
}: {
  width: number;
  setWidth: (n: number) => void;
}) {
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startW: width };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    setWidth(dragRef.current.startW + dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="relative shrink-0 group cursor-col-resize select-none"
      style={{ width: 4 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      data-no-export="true"
      title="Arrastra para redimensionar"
    >
      <div
        className={
          "absolute inset-y-0 left-0 right-0 transition-colors " +
          (dragging ? "bg-ink/40" : "bg-paper-line group-hover:bg-ink/30")
        }
      />
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
