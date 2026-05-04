"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Copy, IndentIncrease, IndentDecrease, ChevronUp, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { TASK_COLORS, type Task } from "@/lib/types";
import clsx from "clsx";
import { useT } from "@/lib/i18n";

interface Props {
  id: string;
  onClose: () => void;
}

export default function TaskDialog({ id, onClose }: Props) {
  const tt = useT();
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const allTasks = useStore((s) => s.tasks);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const duplicateTask = useStore((s) => s.duplicateTask);
  const indent = useStore((s) => s.indent);
  const outdent = useStore((s) => s.outdent);
  const moveRow = useStore((s) => s.moveRow);

  const [draft, setDraft] = useState<Task | null>(task ?? null);

  useEffect(() => {
    setDraft(task ?? null);
  }, [task]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!draft || !task) return null;

  const commit = (patch: Partial<Task>) => {
    setDraft({ ...draft, ...patch });
    updateTask(id, patch);
  };

  // candidates for dependency (everything except itself and its descendants)
  const isDescendant = (a: string, ancestor: string): boolean => {
    let cur = allTasks.find((x) => x.id === a);
    while (cur && cur.parentId) {
      if (cur.parentId === ancestor) return true;
      cur = allTasks.find((x) => x.id === cur!.parentId);
    }
    return false;
  };
  const depCandidates = allTasks.filter(
    (t) => t.id !== id && !isDescendant(t.id, id),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-paper border border-paper-line rounded-lg shadow-paper overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-paper-line">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
              {tt.edit_task}
            </span>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label={tt.close}>
            <X size={16} />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <div>
            <label className="field-label">{tt.name}</label>
            <input
              className="field font-sans text-base"
              value={draft.name}
              onChange={(e) => commit({ name: e.target.value })}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">{tt.start}</label>
              <input
                type="date"
                className="field"
                value={draft.start}
                onChange={(e) => {
                  const start = e.target.value;
                  // keep end >= start
                  const end = draft.end < start ? start : draft.end;
                  commit({ start, end });
                }}
              />
            </div>
            <div>
              <label className="field-label">{tt.end}</label>
              <input
                type="date"
                className="field"
                value={draft.end}
                min={draft.start}
                onChange={(e) =>
                  commit({ end: e.target.value < draft.start ? draft.start : e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="field-label">{tt.progress} ({draft.progress}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.progress}
              onChange={(e) => commit({ progress: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="field-label">{tt.budget}</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className="field"
              value={draft.budget ?? ""}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  commit({ budget: undefined });
                } else {
                  const n = Number(raw);
                  if (Number.isFinite(n)) commit({ budget: n });
                }
              }}
            />
          </div>

          <div>
            <label className="field-label">{tt.color}</label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => commit({ color: undefined })}
                className={clsx(
                  "h-7 w-7 rounded-full border-2 grid place-items-center text-[10px] font-mono",
                  !draft.color ? "border-ink" : "border-paper-line",
                )}
                aria-label={tt.default_color}
                title={tt.default_color}
              >
                ·
              </button>
              {TASK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => commit({ color: c })}
                  className={clsx(
                    "h-7 w-7 rounded-full border-2",
                    draft.color === c ? "border-ink" : "border-paper-line",
                  )}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                  title={c}
                />
              ))}

              <span className="mx-1 h-5 w-px bg-paper-line" aria-hidden />

              <label
                className={clsx(
                  "relative h-7 w-7 rounded-full border-2 cursor-pointer overflow-hidden grid place-items-center",
                  draft.color && !TASK_COLORS.includes(draft.color as any)
                    ? "border-ink"
                    : "border-paper-line",
                )}
                title={tt.custom_color}
                aria-label={tt.custom_color}
                style={{
                  background:
                    draft.color && !TASK_COLORS.includes(draft.color as any)
                      ? draft.color
                      : "conic-gradient(from 0deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f87171)",
                }}
              >
                <input
                  type="color"
                  value={
                    draft.color && /^#[0-9a-f]{6}$/i.test(draft.color)
                      ? draft.color
                      : "#0E1116"
                  }
                  onChange={(e) => commit({ color: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>

              <input
                type="text"
                value={draft.color ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    commit({ color: undefined });
                  } else if (/^#[0-9a-f]{6}$/i.test(v)) {
                    commit({ color: v });
                  } else {
                    setDraft({ ...draft, color: v });
                  }
                }}
                placeholder="#hex"
                className="field font-mono text-xs w-24 py-1"
                spellCheck={false}
                maxLength={7}
              />
            </div>
          </div>

          <div>
            <label className="field-label">{tt.dependencies}</label>
            <div className="max-h-32 overflow-y-auto border border-paper-line rounded-md p-2 space-y-1 bg-paper-warm/40">
              {depCandidates.length === 0 && (
                <p className="text-xs text-ink-muted px-1 py-0.5">{tt.no_other_tasks}</p>
              )}
              {depCandidates.map((t) => {
                const checked = draft.dependencies.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 px-1.5 py-0.5 text-sm cursor-pointer hover:bg-paper rounded"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...draft.dependencies, t.id]
                          : draft.dependencies.filter((d) => d !== t.id);
                        commit({ dependencies: next });
                      }}
                      className="accent-ink"
                    />
                    <span className="font-mono text-xs text-ink-muted">{t.id.slice(2, 6)}</span>
                    <span className="truncate">{t.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!draft.hideLabel}
                onChange={(e) => commit({ hideLabel: e.target.checked })}
                className="accent-ink"
              />
              <span>{tt.hide_label}</span>
            </label>
          </div>

          <div>
            <label className="field-label">{tt.notes}</label>
            <textarea
              className="field font-sans"
              rows={2}
              value={draft.notes ?? ""}
              onChange={(e) => commit({ notes: e.target.value })}
            />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-2 px-5 py-3 border-t border-paper-line bg-paper-warm/40">
          <div className="flex items-center gap-1">
            <button className="btn btn-icon btn-ghost" onClick={() => moveRow(id, -1)} aria-label={tt.up}>
              <ChevronUp size={16} />
            </button>
            <button className="btn btn-icon btn-ghost" onClick={() => moveRow(id, 1)} aria-label={tt.down}>
              <ChevronDown size={16} />
            </button>
            <button className="btn btn-icon btn-ghost" onClick={() => outdent(id)} aria-label={tt.outdent}>
              <IndentDecrease size={16} />
            </button>
            <button className="btn btn-icon btn-ghost" onClick={() => indent(id)} aria-label={tt.indent}>
              <IndentIncrease size={16} />
            </button>
            <button className="btn btn-icon btn-ghost" onClick={() => duplicateTask(id)} aria-label={tt.duplicate}>
              <Copy size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="btn text-accent border-accent/40 hover:bg-accent/10"
              onClick={() => {
                deleteTask(id);
                onClose();
              }}
            >
              <Trash2 size={14} />
              {tt.delete}
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              {tt.done}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
