"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/date-utils";

interface Props {
  onClose: () => void;
}

export default function RestartDialog({ onClose }: Props) {
  const project = useStore((s) => s.project);
  const restartFromDate = useStore((s) => s.restartFromDate);

  const [date, setDate] = useState<string>(todayISO());
  const [name, setName] = useState<string>(project.name);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-paper border border-paper-line rounded-lg shadow-paper overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-paper-line">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
            Reiniciar proyecto
          </span>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div className="flex gap-3 items-start p-3 rounded-md bg-accent/10 border border-accent/30">
            <AlertTriangle size={18} className="text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-ink-soft">
              Borra <strong className="text-ink">todas</strong> las tareas y dependencias actuales.
              Empieza limpio desde la fecha que elijas.
            </p>
          </div>

          <div>
            <label className="field-label">Nombre del proyecto</label>
            <input
              className="field font-sans"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label">Fecha de inicio</label>
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="accent-accent"
            />
            Confirmo que quiero borrar las tareas actuales
          </label>
        </div>

        <footer className="flex justify-end gap-2 px-5 py-3 border-t border-paper-line bg-paper-warm/40">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary disabled:bg-ink-muted disabled:border-ink-muted"
            disabled={!confirm}
            onClick={() => {
              restartFromDate(date, name.trim() || project.name);
              onClose();
            }}
          >
            Reiniciar
          </button>
        </footer>
      </div>
    </div>
  );
}
