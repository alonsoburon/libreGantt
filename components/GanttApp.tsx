"use client";

import { useEffect, useRef, useState } from "react";
import { Resizable } from "re-resizable";
import { useStore } from "@/lib/store";
import Toolbar from "./Toolbar";
import TaskTable from "./TaskTable";
import GanttChart from "./GanttChart";
import TaskDialog from "./TaskDialog";
import RestartDialog from "./RestartDialog";
import LanguageSwitch from "./LanguageSwitch";
import { format, fromISO } from "@/lib/date-utils";
import { useT } from "@/lib/i18n";

const TASK_LIST_DEFAULT = 380;
const TASK_LIST_MIN = 280;
const TASK_LIST_MAX = 900;
const TASK_LIST_W_KEY = "gantt-task-list-w";
const BASE_ROW_H = 36;
const BASE_FONT_PX = 14;

export default function GanttApp() {
  const fontScale = useStore((s) => s.fontScale);
  const t = useT();

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
        {t.loading}
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
            <Resizable
              size={{ width: taskListW, height: "auto" }}
              minWidth={TASK_LIST_MIN}
              maxWidth={TASK_LIST_MAX}
              enable={{ right: true }}
              onResizeStop={(_e, _dir, _ref, d) => updateTaskListW(taskListW + d.width)}
              handleClasses={{ right: "gantt-resize-handle" }}
              handleStyles={{ right: { width: 6, right: -3, cursor: "col-resize" } }}
              className="shrink-0"
            >
              <TaskTable rowHeight={rowHeight} width={taskListW} onEdit={setEditingId} />
            </Resizable>
            <GanttChart rowHeight={rowHeight} onEdit={setEditingId} />
          </div>
        </div>
      </main>

      {editingId && <TaskDialog id={editingId} onClose={() => setEditingId(null)} />}
      {restartOpen && <RestartDialog onClose={() => setRestartOpen(false)} />}

      <LanguageSwitch />
    </div>
  );
}

function ExportHeader() {
  const t = useT();
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
          {tasks.length} {tasks.length === 1 ? t.tasks_one : t.tasks_other}
        </span>
        <span className="text-xs font-mono text-ink-muted">
          {format(fromISO(minStart), "d MMM yyyy")} —{" "}
          {format(fromISO(maxEnd), "d MMM yyyy")}
        </span>
      </div>
      <input
        value={project.description ?? ""}
        onChange={(e) => setProject({ description: e.target.value })}
        placeholder={t.project_description_placeholder}
        className="mt-1 w-full max-w-2xl bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-0 text-sm text-ink-soft placeholder:text-ink-muted/60"
      />
    </div>
  );
}

function clampTaskListW(w: number): number {
  return Math.max(TASK_LIST_MIN, Math.min(TASK_LIST_MAX, Math.round(w)));
}

