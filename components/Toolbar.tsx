"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  RotateCcw,
  Image as ImageIcon,
  FileDown,
  Upload,
  Download,
  Eye,
  EyeOff,
  Type,
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarOff,
  MoveHorizontal,
  CircleDot,
  Tag,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { exportPNG, exportPDF, exportJSON, importJSON } from "@/lib/export";
import type { GanttData, TimeScale } from "@/lib/types";
import { useT } from "@/lib/i18n";

interface Props {
  exportRef: React.RefObject<HTMLDivElement | null>;
  onRestartClick: () => void;
}

const TOOLBAR_FULL_H = 56;
const TOOLBAR_MIN_H = 8;
const TOOLBAR_H_KEY = "gantt-toolbar-h";

export default function Toolbar({ exportRef, onRestartClick }: Props) {
  const t = useT();
  const project = useStore((s) => s.project);
  const setProject = useStore((s) => s.setProject);
  const tasks = useStore((s) => s.tasks);
  const order = useStore((s) => s.order);
  const scale = useStore((s) => s.scale);
  const setScale = useStore((s) => s.setScale);
  const showDeps = useStore((s) => s.showDependencies);
  const setShowDeps = useStore((s) => s.setShowDependencies);
  const showWeekends = useStore((s) => s.showWeekends);
  const setShowWeekends = useStore((s) => s.setShowWeekends);
  const showToday = useStore((s) => s.showToday);
  const setShowToday = useStore((s) => s.setShowToday);
  const labelMode = useStore((s) => s.labelMode);
  const cycleLabelMode = useStore((s) => s.cycleLabelMode);
  const fontScale = useStore((s) => s.fontScale);
  const setFontScale = useStore((s) => s.setFontScale);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const addTask = useStore((s) => s.addTask);
  const loadData = useStore((s) => s.loadData);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  const [toolbarH, setToolbarH] = useState<number>(TOOLBAR_FULL_H);
  const dragStateRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(TOOLBAR_H_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n)) setToolbarH(clampH(n));
    }
  }, []);

  const updateH = (h: number) => {
    const next = clampH(h);
    setToolbarH(next);
    localStorage.setItem(TOOLBAR_H_KEY, String(next));
  };

  const onDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = { startY: e.clientY, startH: toolbarH };
  };
  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!dragStateRef.current) return;
    const dy = e.clientY - dragStateRef.current.startY;
    updateH(dragStateRef.current.startH + dy);
  };
  const onDragPointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragStateRef.current = null;
  };
  const onDragDoubleClick = () => {
    updateH(toolbarH < TOOLBAR_FULL_H * 0.6 ? TOOLBAR_FULL_H : TOOLBAR_MIN_H);
  };

  const handlePNG = async () => {
    if (!exportRef.current) return;
    setBusy("png");
    try {
      await exportPNG(exportRef.current, slugify(project.name) + ".png");
    } finally {
      setBusy(null);
    }
  };

  const handlePDF = async () => {
    if (!exportRef.current) return;
    setBusy("pdf");
    try {
      await exportPDF(exportRef.current, slugify(project.name) + ".pdf");
    } finally {
      setBusy(null);
    }
  };

  const handleExportJSON = () => {
    exportJSON({ project, tasks, order }, slugify(project.name) + ".json");
  };

  const handleImportClick = () => fileRef.current?.click();
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = (await importJSON(file)) as GanttData;
      if (data && data.project && Array.isArray(data.tasks)) {
        loadData({ ...data, order: data.order ?? data.tasks.map((t) => t.id) });
      } else {
        alert(t.invalid_json);
      }
    } catch {
      alert(t.cant_read_file);
    } finally {
      e.target.value = "";
    }
  };

  const SCALE_OPTIONS: { value: TimeScale; label: string; icon: React.ReactNode }[] = [
    { value: "day", label: t.days, icon: <Calendar size={14} /> },
    { value: "week", label: t.weeks, icon: <CalendarDays size={14} /> },
    { value: "month", label: t.months, icon: <CalendarRange size={14} /> },
  ];

  return (
    <header
      className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-paper-line"
      data-no-export="true"
    >
      <div
        className="overflow-y-hidden overflow-x-auto gantt-scroll transition-[height] duration-150"
        style={{ height: toolbarH }}
      >
        <div className="px-5 py-3 flex items-center gap-3 whitespace-nowrap w-full min-w-max">
          <div className="flex items-center gap-2 mr-2">
            <div className="h-7 w-7 rounded-md bg-ink grid place-items-center">
              <span className="font-display italic text-paper text-base leading-none">G</span>
            </div>
            <input
              value={project.name}
              onChange={(e) => setProject({ name: e.target.value })}
              className="font-display text-2xl bg-transparent border-none focus:outline-none focus:ring-0 px-1 py-0 min-w-0 max-w-[300px]"
              placeholder={t.untitled}
            />
          </div>

          <div className="h-6 w-px bg-paper-line" />

          <div className="flex items-center gap-0.5 p-0.5 bg-paper-warm rounded-md border border-paper-line">
            {SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScale(opt.value)}
                className={clsx(
                  "px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition",
                  scale === opt.value
                    ? "bg-paper text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 p-0.5 bg-paper-warm rounded-md border border-paper-line">
            <button
              onClick={() => setFontScale(fontScale - 0.1)}
              className="px-2 py-1 text-xs font-medium text-ink-muted hover:text-ink rounded"
              title={t.shrink_text}
              disabled={fontScale <= 0.81}
            >
              <Type size={12} />
            </button>
            <span className="px-2 text-[10px] font-mono text-ink-muted tabular-nums w-9 text-center">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              onClick={() => setFontScale(fontScale + 0.1)}
              className="px-2 py-1 text-xs font-medium text-ink-muted hover:text-ink rounded"
              title={t.grow_text}
              disabled={fontScale >= 1.49}
            >
              <Type size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowDeps(!showDeps)}
            className={clsx("btn", showDeps && "bg-paper-warm")}
            title={t.connections_toggle}
          >
            {showDeps ? <Eye size={14} /> : <EyeOff size={14} />}
            {t.connections}
          </button>

          <button
            onClick={() => setShowWeekends(!showWeekends)}
            className={clsx("btn", showWeekends && "bg-paper-warm")}
            title={t.weekends_toggle}
          >
            {showWeekends ? <Calendar size={14} /> : <CalendarOff size={14} />}
            {t.weekends}
          </button>

          <button
            onClick={() => setShowToday(!showToday)}
            className={clsx("btn", showToday && "bg-paper-warm")}
            title={t.today_marker_toggle}
          >
            <CircleDot
              size={14}
              className={showToday ? "text-accent" : "text-ink-muted"}
            />
            {t.today_marker}
          </button>

          <button
            onClick={cycleLabelMode}
            className={clsx("btn", labelMode !== "in" && "bg-paper-warm")}
            title={t.label_mode_toggle}
          >
            <Tag
              size={14}
              className={clsx(
                labelMode === "off" && "opacity-40 line-through",
                labelMode === "out" && "text-accent",
              )}
            />
            {labelMode === "in"
              ? t.labels_in
              : labelMode === "out"
              ? t.labels_out
              : t.labels_off}
          </button>

          <div
            className="flex items-center gap-2 px-2 py-1 bg-paper-warm rounded-md border border-paper-line"
            title={t.zoom_tip}
          >
            <MoveHorizontal size={14} className="text-ink-muted" />
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              onDoubleClick={() => setZoom(1)}
              className="gantt-zoom-slider w-24 accent-ink"
              aria-label={t.zoom}
            />
            <span className="text-[10px] font-mono text-ink-muted tabular-nums w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button onClick={() => addTask(null)} className="btn btn-primary">
              <Plus size={14} />
              {t.add_task}
            </button>

            <button onClick={onRestartClick} className="btn" title={t.restart_tip}>
              <RotateCcw size={14} />
              {t.restart}
            </button>

            <div className="h-6 w-px bg-paper-line" />

            <button
              onClick={handlePNG}
              className="btn"
              disabled={busy !== null}
            >
              <ImageIcon size={14} />
              {busy === "png" ? t.generating : "PNG"}
            </button>
            <button
              onClick={handlePDF}
              className="btn"
              disabled={busy !== null}
            >
              <FileDown size={14} />
              {busy === "pdf" ? t.generating : "PDF"}
            </button>

            <div className="h-6 w-px bg-paper-line" />

            <button onClick={handleExportJSON} className="btn btn-ghost" title={t.export_json}>
              <Download size={14} />
            </button>
            <button onClick={handleImportClick} className="btn btn-ghost" title={t.import_json}>
              <Upload size={14} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      {/* Drag bar to compress/expand the toolbar */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={toolbarH <= TOOLBAR_MIN_H + 4 ? t.expand_toolbar : t.collapse_toolbar}
        title={toolbarH <= TOOLBAR_MIN_H + 4 ? t.expand_toolbar : t.collapse_toolbar}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onDoubleClick={onDragDoubleClick}
        className="h-2 w-full cursor-ns-resize flex items-center justify-center group hover:bg-paper-warm/60 transition"
      >
        <div className="h-1 w-12 rounded-full bg-paper-line group-hover:bg-ink/40 transition" />
      </div>
    </header>
  );
}

function clampH(h: number): number {
  return Math.max(TOOLBAR_MIN_H, Math.min(TOOLBAR_FULL_H, Math.round(h)));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "gantt";
}
