"use client";

import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Pencil,
} from "lucide-react";
import clsx from "clsx";
import {
  useStore,
  selectVisibleOrder,
  getDepth,
  hasChildren,
} from "@/lib/store";
import type { Task } from "@/lib/types";

interface Props {
  rowHeight: number;
  width: number;
  onEdit: (id: string) => void;
}

export const TABLE_HEADER_H = 56;

export default function TaskTable({ rowHeight, width, onEdit }: Props) {
  const tasks = useStore((s) => s.tasks);
  const visibleOrder = useStore(selectVisibleOrder);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const moveRow = useStore((s) => s.moveRow);
  const addTask = useStore((s) => s.addTask);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return (
    <div
      className="sticky left-0 z-20 bg-paper border-r border-paper-line shrink-0"
      style={{ width }}
    >
      {/* Header row */}
      <div
        className="flex items-end px-4 pb-2 border-b border-paper-line bg-paper-warm/40"
        style={{ height: TABLE_HEADER_H }}
      >
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
            Tarea
          </div>
        </div>
        <div className="w-20 text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
          Inicio
        </div>
        <div className="w-20 text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
          Fin
        </div>
        <div className="w-12 text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
          %
        </div>
      </div>

      {/* Rows */}
      <div>
        {visibleOrder.map((id) => {
          const task = taskMap.get(id);
          if (!task) return null;
          return (
            <Row
              key={id}
              task={task}
              depth={getDepth(tasks, id)}
              isGroup={hasChildren(tasks, id)}
              selected={selectedId === id}
              rowHeight={rowHeight}
              onSelect={() => select(id)}
              onEdit={() => onEdit(id)}
              onToggle={() => toggleCollapse(id)}
              onUp={() => moveRow(id, -1)}
              onDown={() => moveRow(id, 1)}
              onAddSub={() => addTask(id)}
            />
          );
        })}

        {/* Add row */}
        <button
          onClick={() => addTask(null)}
          className="w-full flex items-center gap-2 px-4 text-sm text-ink-muted hover:text-ink hover:bg-paper-warm/50 transition border-b border-dashed border-paper-line"
          style={{ height: rowHeight }}
          data-no-export="true"
        >
          <Plus size={14} />
          Nueva tarea
        </button>
      </div>
    </div>
  );
}

function Row({
  task,
  depth,
  isGroup,
  selected,
  rowHeight,
  onSelect,
  onEdit,
  onToggle,
  onUp,
  onDown,
  onAddSub,
}: {
  task: Task;
  depth: number;
  isGroup: boolean;
  selected: boolean;
  rowHeight: number;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onAddSub: () => void;
}) {
  return (
    <div
      className={clsx(
        "flex items-center px-2 border-b border-paper-line/70 group cursor-pointer",
        selected ? "bg-accent/8" : "hover:bg-paper-warm/40",
      )}
      style={{ height: rowHeight }}
      onClick={onSelect}
      onDoubleClick={onEdit}
    >
      {/* drag handle (display-only / row buttons) */}
      <div
        className="opacity-0 group-hover:opacity-100 flex flex-col -my-2 mr-0.5"
        data-no-export="true"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUp();
          }}
          className="text-ink-muted hover:text-ink p-0.5"
          aria-label="Subir"
        >
          <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 5 L5 1 L9 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDown();
          }}
          className="text-ink-muted hover:text-ink p-0.5"
          aria-label="Bajar"
        >
          <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* indent + collapse */}
      <div style={{ width: depth * 14 }} className="shrink-0" />
      {isGroup ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-ink-muted hover:text-ink shrink-0"
        >
          {task.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
      ) : (
        <span className="w-3.5 shrink-0" />
      )}

      {/* color dot */}
      <span
        className="ml-1.5 mr-2 h-2 w-2 rounded-full shrink-0"
        style={{ background: task.color ?? (isGroup ? "#0E1116" : "#5B6270") }}
      />

      {/* name */}
      <div className="flex-1 min-w-0">
        <div
          className={clsx(
            "truncate text-sm",
            isGroup ? "font-display italic text-base" : "font-sans",
            selected && "text-ink font-semibold",
          )}
        >
          {task.name}
        </div>
      </div>

      {/* dates + progress */}
      <div className="w-20 text-right text-[11px] font-mono text-ink-muted tabular-nums">
        {fmt(task.start)}
      </div>
      <div className="w-20 text-right text-[11px] font-mono text-ink-muted tabular-nums">
        {fmt(task.end)}
      </div>
      <div className="w-12 text-right text-[11px] font-mono text-ink tabular-nums">
        {Math.round(task.progress)}%
      </div>

      {/* row actions */}
      <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100" data-no-export="true">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSub();
          }}
          className="p-1 rounded hover:bg-paper text-ink-muted hover:text-ink"
          title="Subtarea"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded hover:bg-paper text-ink-muted hover:text-ink"
          title="Editar"
        >
          <Pencil size={12} />
        </button>
      </div>
    </div>
  );
}

function fmt(iso: string): string {
  // Compact MM-DD
  return iso.slice(5);
}
