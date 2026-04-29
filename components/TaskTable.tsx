"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { useShallow } from "zustand/react/shallow";
import {
  useStore,
  selectVisibleOrder,
  getDepth,
  hasChildren,
  rolledUpBudget,
} from "@/lib/store";
import type { Task } from "@/lib/types";
import { useT } from "@/lib/i18n";

interface Props {
  rowHeight: number;
  width: number;
  onEdit: (id: string) => void;
}

export const TABLE_HEADER_H = 56;

// Tight column widths so the task list panel can stay compact.
const COL_DATE = 42; // "MM-DD" in 11px mono
const COL_BUDGET = 96;
const COL_PCT = 36;

export default function TaskTable({ rowHeight, width, onEdit }: Props) {
  const t = useT();
  const tasks = useStore((s) => s.tasks);
  const visibleOrder = useStore(useShallow(selectVisibleOrder));
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const toggleCollapse = useStore((s) => s.toggleCollapse);
  const moveRow = useStore((s) => s.moveRow);
  const addTask = useStore((s) => s.addTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const updateTask = useStore((s) => s.updateTask);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  return (
    <div
      className="sticky left-0 z-20 bg-paper border-r border-paper-line shrink-0"
      style={{ width }}
    >
      {/* Header row */}
      <div
        className="flex items-end px-3 pb-2 border-b border-paper-line bg-paper-warm/40 gap-1"
        style={{ height: TABLE_HEADER_H }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono">
            {t.task}
          </div>
        </div>
        <div
          className="text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono shrink-0"
          style={{ width: COL_DATE }}
        >
          {t.start}
        </div>
        <div
          className="text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono shrink-0"
          style={{ width: COL_DATE }}
        >
          {t.end}
        </div>
        <div
          className="text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono shrink-0"
          style={{ width: COL_BUDGET }}
          title={t.budget}
        >
          $
        </div>
        <div
          className="text-right text-[10px] uppercase tracking-[0.18em] text-ink-muted font-mono shrink-0"
          style={{ width: COL_PCT }}
        >
          %
        </div>
      </div>

      {/* Rows */}
      <div>
        {visibleOrder.map((id) => {
          const task = taskMap.get(id);
          if (!task) return null;
          const isGroup = hasChildren(tasks, id);
          const groupBudget = isGroup ? rolledUpBudget(tasks, id) : undefined;
          return (
            <Row
              key={id}
              task={task}
              depth={getDepth(tasks, id)}
              isGroup={isGroup}
              groupBudget={groupBudget}
              selected={selectedId === id}
              rowHeight={rowHeight}
              onSelect={() => select(id)}
              onEdit={() => onEdit(id)}
              onToggle={() => toggleCollapse(id)}
              onUp={() => moveRow(id, -1)}
              onDown={() => moveRow(id, 1)}
              onAddSub={() => addTask(id)}
              onBudgetChange={(v) => updateTask(id, { budget: v })}
              onDelete={() => {
                const tt = taskMap.get(id);
                const name = tt?.name ?? t.this_task;
                const hasKids = hasChildren(tasks, id);
                const msg = hasKids ? t.delete_with_kids_q(name) : t.delete_q(name);
                if (confirm(msg)) deleteTask(id);
              }}
            />
          );
        })}

        {/* Add row */}
        <button
          onClick={() => addTask(null)}
          className="w-full flex items-center gap-2 px-3 text-sm text-ink-muted hover:text-ink hover:bg-paper-warm/50 transition border-b border-dashed border-paper-line"
          style={{ height: rowHeight }}
          data-no-export="true"
        >
          <Plus size={14} />
          {t.new_task}
        </button>
      </div>
    </div>
  );
}

function Row({
  task,
  depth,
  isGroup,
  groupBudget,
  selected,
  rowHeight,
  onSelect,
  onEdit,
  onToggle,
  onUp,
  onDown,
  onAddSub,
  onBudgetChange,
  onDelete,
}: {
  task: Task;
  depth: number;
  isGroup: boolean;
  groupBudget: number | undefined;
  selected: boolean;
  rowHeight: number;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onAddSub: () => void;
  onBudgetChange: (v: number | undefined) => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <div
      className={clsx(
        "relative flex items-center px-3 border-b border-paper-line/70 group cursor-pointer gap-1",
        selected ? "bg-accent/8" : "hover:bg-paper-warm/40",
      )}
      style={{ height: rowHeight }}
      onClick={onSelect}
      onDoubleClick={onEdit}
    >
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
        className="ml-1 mr-1.5 h-2 w-2 rounded-full shrink-0"
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
          title={task.name}
        >
          {task.name}
        </div>
      </div>

      {/* dates */}
      <div
        className="text-right text-[11px] font-mono text-ink-muted tabular-nums shrink-0"
        style={{ width: COL_DATE }}
      >
        {fmtDate(task.start)}
      </div>
      <div
        className="text-right text-[11px] font-mono text-ink-muted tabular-nums shrink-0"
        style={{ width: COL_DATE }}
      >
        {fmtDate(task.end)}
      </div>

      {/* budget */}
      <div
        className="text-right text-[11px] font-mono text-ink-muted tabular-nums shrink-0"
        style={{ width: COL_BUDGET }}
        onClick={(e) => e.stopPropagation()}
      >
        {isGroup ? (
          <span
            className="block w-full text-right truncate text-ink-soft"
            title={groupBudget !== undefined ? formatBudgetFull(groupBudget) : ""}
          >
            {groupBudget !== undefined ? formatBudgetCompact(groupBudget) : "—"}
          </span>
        ) : (
          <BudgetInput value={task.budget} onChange={onBudgetChange} />
        )}
      </div>

      {/* progress */}
      <div
        className="text-right text-[11px] font-mono text-ink tabular-nums shrink-0"
        style={{ width: COL_PCT }}
      >
        {Math.round(task.progress)}%
      </div>

      {/* row actions — absolute overlay so they never displace the columns */}
      <div
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 bg-gradient-to-l from-paper-warm via-paper-warm to-paper-warm/0 pl-3 pr-1 rounded"
        data-no-export="true"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUp();
          }}
          className="p-1 rounded hover:bg-paper text-ink-muted hover:text-ink"
          title={t.up}
          aria-label={t.up}
        >
          <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 5 L5 1 L9 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDown();
          }}
          className="p-1 rounded hover:bg-paper text-ink-muted hover:text-ink"
          title={t.down}
          aria-label={t.down}
        >
          <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1 L5 5 L9 1" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSub();
          }}
          className="p-1 rounded hover:bg-paper text-ink-muted hover:text-ink"
          title={t.subtask}
        >
          <Plus size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded hover:bg-paper text-ink-muted hover:text-ink"
          title={t.edit}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-red-50 text-ink-muted hover:text-red-600"
          title={t.delete_short}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function BudgetInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>("");

  const display = focused
    ? draft
    : value !== undefined
    ? formatBudgetFull(value)
    : "";

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      placeholder="—"
      onFocus={() => {
        setFocused(true);
        setDraft(value !== undefined ? String(value) : "");
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.-]/g, "");
        setDraft(raw);
        if (raw === "" || raw === "-") {
          onChange(undefined);
        } else {
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : undefined);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="w-full bg-transparent text-right text-[11px] font-mono tabular-nums text-ink-soft placeholder:text-ink-muted/50 focus:outline-none focus:bg-paper focus:ring-1 focus:ring-ink/15 rounded px-1 py-0.5"
      title={value !== undefined ? formatBudgetFull(value) : ""}
    />
  );
}

function fmtDate(iso: string): string {
  // Compact MM-DD
  return iso.slice(5);
}

function formatBudgetCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `$${trim(n / 1_000)}K`;
  if (abs >= 1_000) return `$${trim(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function formatBudgetFull(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function trim(n: number): string {
  // Up to 1 decimal, no trailing zero
  const r = Math.round(n * 10) / 10;
  return r.toString();
}
