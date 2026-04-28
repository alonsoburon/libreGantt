"use client";

import { useRef, useState } from "react";
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
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { exportPNG, exportPDF, exportJSON, importJSON } from "@/lib/export";
import type { GanttData, TimeScale } from "@/lib/types";

interface Props {
  exportRef: React.RefObject<HTMLDivElement | null>;
  onRestartClick: () => void;
}

const SCALE_OPTIONS: { value: TimeScale; label: string; icon: React.ReactNode }[] = [
  { value: "day", label: "Días", icon: <Calendar size={14} /> },
  { value: "week", label: "Semanas", icon: <CalendarDays size={14} /> },
  { value: "month", label: "Meses", icon: <CalendarRange size={14} /> },
];

export default function Toolbar({ exportRef, onRestartClick }: Props) {
  const project = useStore((s) => s.project);
  const setProject = useStore((s) => s.setProject);
  const tasks = useStore((s) => s.tasks);
  const order = useStore((s) => s.order);
  const scale = useStore((s) => s.scale);
  const setScale = useStore((s) => s.setScale);
  const showDeps = useStore((s) => s.showDependencies);
  const setShowDeps = useStore((s) => s.setShowDependencies);
  const fontScale = useStore((s) => s.fontScale);
  const setFontScale = useStore((s) => s.setFontScale);
  const addTask = useStore((s) => s.addTask);
  const loadData = useStore((s) => s.loadData);

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

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
        alert("Archivo JSON inválido");
      }
    } catch {
      alert("No pude leer el archivo");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <header
      className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-paper-line"
      data-no-export="true"
    >
      <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-2">
          <div className="h-7 w-7 rounded-md bg-ink grid place-items-center">
            <span className="font-display italic text-paper text-base leading-none">G</span>
          </div>
          <input
            value={project.name}
            onChange={(e) => setProject({ name: e.target.value })}
            className="font-display text-2xl bg-transparent border-none focus:outline-none focus:ring-0 px-1 py-0 min-w-0 max-w-[300px]"
            placeholder="Sin título"
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
            title="Achicar texto"
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
            title="Agrandar texto"
            disabled={fontScale >= 1.49}
          >
            <Type size={16} />
          </button>
        </div>

        <button
          onClick={() => setShowDeps(!showDeps)}
          className={clsx("btn", showDeps && "bg-paper-warm")}
          title="Mostrar/ocultar conexiones"
        >
          {showDeps ? <Eye size={14} /> : <EyeOff size={14} />}
          Conexiones
        </button>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <button onClick={() => addTask(null)} className="btn btn-primary">
            <Plus size={14} />
            Tarea
          </button>

          <button onClick={onRestartClick} className="btn" title="Borrar todo y empezar de cero">
            <RotateCcw size={14} />
            Reiniciar
          </button>

          <div className="h-6 w-px bg-paper-line" />

          <button
            onClick={handlePNG}
            className="btn"
            disabled={busy !== null}
          >
            <ImageIcon size={14} />
            {busy === "png" ? "Generando…" : "PNG"}
          </button>
          <button
            onClick={handlePDF}
            className="btn"
            disabled={busy !== null}
          >
            <FileDown size={14} />
            {busy === "pdf" ? "Generando…" : "PDF"}
          </button>

          <div className="h-6 w-px bg-paper-line" />

          <button onClick={handleExportJSON} className="btn btn-ghost" title="Exportar JSON">
            <Download size={14} />
          </button>
          <button onClick={handleImportClick} className="btn btn-ghost" title="Importar JSON">
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
    </header>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "gantt";
}
