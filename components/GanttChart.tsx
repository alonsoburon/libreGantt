"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useStore,
  selectVisibleOrder,
  hasChildren,
  computeGroupBounds,
} from "@/lib/store";
import {
  buildRange,
  daysBetween,
  fromISO,
  isWeekend,
  todayISO,
  shiftISO,
} from "@/lib/date-utils";
import type { Task, TaskId } from "@/lib/types";
import TimelineHeader, { TIMELINE_HEADER_H } from "./TimelineHeader";
import TaskBar from "./TaskBar";
import DependencyArrows from "./DependencyArrows";

interface Props {
  rowHeight: number;
  onEdit: (id: string) => void;
}

export default function GanttChart({ rowHeight, onEdit }: Props) {
  const tasksRaw = useStore((s) => s.tasks);
  const visibleOrder = useStore(useShallow(selectVisibleOrder));
  const project = useStore((s) => s.project);
  const scale = useStore((s) => s.scale);
  const showDeps = useStore((s) => s.showDependencies);
  const showWeekends = useStore((s) => s.showWeekends);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const updateTask = useStore((s) => s.updateTask);
  const addTask = useStore((s) => s.addTask);
  const addDependency = useStore((s) => s.addDependency);
  const removeDependency = useStore((s) => s.removeDependency);

  // Compute group bounds from children for display
  const tasks = useMemo(() => computeGroupBounds(tasksRaw), [tasksRaw]);

  const dayWidth = scale === "day" ? 40 : scale === "week" ? 18 : 8;

  const range = useMemo(
    () =>
      buildRange(
        tasks.map((t) => t.start),
        tasks.map((t) => t.end),
        project.startDate,
      ),
    [tasks, project.startDate],
  );

  const totalWidth = range.totalDays * dayWidth;
  const totalRowsHeight = visibleOrder.length * rowHeight + rowHeight; // +1 for trailing empty row
  const totalHeight = totalRowsHeight;

  const todayDays = daysBetween(
    range.start.toISOString().slice(0, 10),
    todayISO(),
  );
  const todayX =
    todayDays >= 0 && todayDays <= range.totalDays
      ? todayDays * dayWidth
      : null;

  const rowIndex = useMemo(() => {
    const m = new Map<TaskId, number>();
    visibleOrder.forEach((id, i) => m.set(id, i));
    return m;
  }, [visibleOrder]);

  // Linking state
  const [linking, setLinking] = useState<{
    fromId: TaskId;
    fromSide: "left" | "right";
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [hoveredTask, setHoveredTask] = useState<TaskId | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Drag-to-create on the empty bottom row
  const [dragCreate, setDragCreate] = useState<{
    startDay: number;
    currentDay: number;
  } | null>(null);

  const xToDay = (clientX: number): number => {
    if (!chartRef.current) return 0;
    const rect = chartRef.current.getBoundingClientRect();
    const localX = clientX - rect.left + chartRef.current.scrollLeft;
    return Math.max(0, Math.floor(localX / dayWidth));
  };

  const onCreateRowPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const day = xToDay(e.clientX);
    setDragCreate({ startDay: day, currentDay: day });
  };

  const onCreateRowPointerMove = (e: React.PointerEvent) => {
    if (!dragCreate) return;
    setDragCreate({ ...dragCreate, currentDay: xToDay(e.clientX) });
  };

  const finishDragCreate = (commit: boolean) => {
    if (!dragCreate) return;
    if (commit) {
      const a = Math.min(dragCreate.startDay, dragCreate.currentDay);
      const b = Math.max(dragCreate.startDay, dragCreate.currentDay);
      const baseISO = range.start.toISOString().slice(0, 10);
      const start = shiftISO(baseISO, a);
      const end = shiftISO(baseISO, b);
      const id = addTask(null);
      updateTask(id, { start, end });
    }
    setDragCreate(null);
  };

  const onCreateRowPointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    finishDragCreate(true);
  };

  const handleLinkStart = (
    taskId: TaskId,
    side: "left" | "right",
    e: React.PointerEvent,
  ) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    setLinking({
      fromId: taskId,
      fromSide: side,
      mouseX: e.clientX - rect.left + chartRef.current.scrollLeft,
      mouseY:
        e.clientY - rect.top - TIMELINE_HEADER_H + chartRef.current.scrollTop,
    });
  };

  useEffect(() => {
    if (!linking) return;
    const onMove = (e: PointerEvent) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      setLinking((l) =>
        l
          ? {
              ...l,
              mouseX: e.clientX - rect.left + chartRef.current!.scrollLeft,
              mouseY:
                e.clientY - rect.top - TIMELINE_HEADER_H +
                chartRef.current!.scrollTop,
            }
          : null,
      );
    };
    const onUp = () => {
      setLinking((l) => {
        if (l && hoveredTask && hoveredTask !== l.fromId) {
          if (l.fromSide === "right") {
            addDependency(l.fromId, hoveredTask);
          } else {
            addDependency(hoveredTask, l.fromId);
          }
        }
        return null;
      });
      setHoveredTask(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLinking(null);
        setHoveredTask(null);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [linking, hoveredTask, addDependency]);

  // Compute pending arrow source point
  const pending = useMemo(() => {
    if (!linking) return null;
    const t = tasks.find((x) => x.id === linking.fromId);
    if (!t) return null;
    const idx = rowIndex.get(t.id);
    if (idx === undefined) return null;
    const fromX =
      linking.fromSide === "right"
        ? ((fromISO(t.end).getTime() - range.start.getTime()) / 86400000) *
            dayWidth +
          dayWidth
        : ((fromISO(t.start).getTime() - range.start.getTime()) / 86400000) *
          dayWidth;
    const fromY = idx * rowHeight + rowHeight / 2;
    return {
      fromX,
      fromY,
      toX: linking.mouseX,
      toY: linking.mouseY,
    };
  }, [linking, tasks, rowIndex, range.start, dayWidth, rowHeight]);

  // Day-strip backgrounds (weekend + today + month dividers)
  const dayBgs = useMemo(() => {
    const out: { x: number; weekend: boolean; monthStart: boolean }[] = [];
    for (let i = 0; i < range.totalDays; i++) {
      const d = new Date(range.start.getTime() + i * 86400000);
      out.push({
        x: i * dayWidth,
        weekend: isWeekend(d),
        monthStart: d.getDate() === 1,
      });
    }
    return out;
  }, [range, dayWidth]);

  return (
    <div ref={chartRef} className="relative grow shrink-0" style={{ width: totalWidth }}>
      <TimelineHeader range={range} scale={scale} dayWidth={dayWidth} todayX={todayX} />

      {/* Body */}
      <div className="relative" style={{ height: totalHeight, width: totalWidth }}>
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none">
          {dayBgs.map((d, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-r"
              style={{
                left: d.x,
                width: dayWidth,
                borderColor: d.monthStart
                  ? "rgba(14,17,22,0.18)"
                  : "rgba(14,17,22,0.06)",
                background:
                  showWeekends && d.weekend
                    ? "rgba(14,17,22,0.025)"
                    : "transparent",
              }}
            />
          ))}
          {/* Row alternation */}
          {visibleOrder.map((id, i) => (
            <div
              key={id}
              className="absolute left-0 right-0 border-b border-paper-line/60"
              style={{
                top: i * rowHeight,
                height: rowHeight,
                background:
                  selectedId === id
                    ? "rgba(194,65,12,0.05)"
                    : i % 2 === 0
                    ? "transparent"
                    : "rgba(14,17,22,0.012)",
              }}
            />
          ))}
          {/* Today vertical line */}
          {todayX !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-accent/60"
              style={{ left: todayX }}
            />
          )}
        </div>

        {/* Bars */}
        {visibleOrder.map((id, i) => {
          const t = tasks.find((x) => x.id === id);
          if (!t) return null;
          const isGroup = hasChildren(tasksRaw, id);
          const isMilestone = !isGroup && t.start === t.end;
          return (
            <div
              key={id}
              className="absolute left-0 right-0"
              style={{ top: i * rowHeight, height: rowHeight }}
            >
              <TaskBar
                task={t}
                isGroup={isGroup}
                isMilestone={isMilestone}
                rangeStart={range.start}
                dayWidth={dayWidth}
                rowHeight={rowHeight}
                selected={selectedId === id}
                onSelect={() => select(id)}
                onEdit={() => onEdit(id)}
                onUpdate={(patch) => updateTask(id, patch)}
                onLinkStart={handleLinkStart}
                linkingActive={linking !== null && linking.fromId !== id}
                onLinkHover={setHoveredTask}
              />
            </div>
          );
        })}

        {/* Dependency arrows */}
        {showDeps && (
          <DependencyArrows
            tasks={tasks}
            visibleOrder={visibleOrder}
            rangeStart={range.start}
            dayWidth={dayWidth}
            rowHeight={rowHeight}
            totalWidth={totalWidth}
            totalHeight={totalHeight}
            onRemove={removeDependency}
            pending={pending}
          />
        )}

        {/* Drag-to-create row: aligned with the "Nueva tarea" row in the task table */}
        <div
          className="absolute left-0 right-0 cursor-crosshair group/create"
          style={{
            top: visibleOrder.length * rowHeight,
            height: rowHeight,
          }}
          onPointerDown={onCreateRowPointerDown}
          onPointerMove={onCreateRowPointerMove}
          onPointerUp={onCreateRowPointerUp}
          onPointerCancel={() => finishDragCreate(false)}
          data-no-export="true"
          title="Arrastra para crear una tarea"
        >
          {dragCreate && (() => {
            const a = Math.min(dragCreate.startDay, dragCreate.currentDay);
            const b = Math.max(dragCreate.startDay, dragCreate.currentDay);
            const left = a * dayWidth;
            const width = Math.max((b - a + 1) * dayWidth, dayWidth);
            const barH = Math.max(rowHeight - 14, 18);
            const top = (rowHeight - barH) / 2;
            return (
              <div
                className="absolute pointer-events-none rounded-md border-2 border-dashed border-ink/60 bg-ink/10 flex items-center px-2 text-[11px] font-mono text-ink-soft"
                style={{ left, width, top, height: barH }}
              >
                {b - a + 1}d
              </div>
            );
          })()}
        </div>

        {/* Linking overlay (catches pointer events to disable text selection) */}
        {linking && (
          <div
            className="absolute inset-0 cursor-crosshair"
            data-no-export="true"
            style={{ background: "transparent" }}
          />
        )}
      </div>
    </div>
  );
}
