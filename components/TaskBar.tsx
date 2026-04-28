"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import type { Task } from "@/lib/types";
import { daysBetween, shiftISO, fromISO } from "@/lib/date-utils";

type DragMode = "move" | "resize-left" | "resize-right" | null;

interface Props {
  task: Task;
  isGroup: boolean;
  isMilestone: boolean;
  rangeStart: Date;
  dayWidth: number;
  rowHeight: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onLinkStart: (taskId: string, side: "left" | "right", e: React.PointerEvent) => void;
  /** Whether this bar is a valid drop target during a linking drag */
  linkingActive: boolean;
  onLinkHover: (taskId: string | null) => void;
}

export default function TaskBar({
  task,
  isGroup,
  isMilestone,
  rangeStart,
  dayWidth,
  rowHeight,
  selected,
  onSelect,
  onEdit,
  onUpdate,
  onLinkStart,
  linkingActive,
  onLinkHover,
}: Props) {
  const startOffset = Math.round(
    ((fromISO(task.start).getTime() - rangeStart.getTime()) / 86400000) * dayWidth,
  );
  const durationDays = daysBetween(task.start, task.end) + 1;
  const width = Math.max(durationDays * dayWidth, isMilestone ? rowHeight - 12 : 12);

  const [drag, setDrag] = useState<DragMode>(null);
  const dragRef = useRef<{
    startX: number;
    origStart: string;
    origEnd: string;
  } | null>(null);

  const color = task.color ?? "#0E1116";

  const onPointerDown = (mode: Exclude<DragMode, null>) => (e: React.PointerEvent) => {
    if (isGroup) return; // groups not draggable
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      origStart: task.start,
      origEnd: task.end,
    };
    setDrag(mode);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const daysDelta = Math.round(dx / dayWidth);
    if (drag === "move") {
      onUpdate({
        start: shiftISO(dragRef.current.origStart, daysDelta),
        end: shiftISO(dragRef.current.origEnd, daysDelta),
      });
    } else if (drag === "resize-left") {
      const newStart = shiftISO(dragRef.current.origStart, daysDelta);
      if (newStart <= dragRef.current.origEnd) {
        onUpdate({ start: newStart });
      }
    } else if (drag === "resize-right") {
      const newEnd = shiftISO(dragRef.current.origEnd, daysDelta);
      if (newEnd >= dragRef.current.origStart) {
        onUpdate({ end: newEnd });
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (drag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setDrag(null);
      dragRef.current = null;
    }
  };

  const handleLinkStart = (side: "left" | "right") => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onLinkStart(task.id, side, e);
  };

  // GROUP rendering: bracket bar
  if (isGroup) {
    return (
      <div
        className="absolute"
        style={{
          left: startOffset,
          width,
          top: rowHeight / 2 - 4,
          height: 8,
        }}
        onClick={onSelect}
        onDoubleClick={onEdit}
        onPointerEnter={() => linkingActive && onLinkHover(task.id)}
        onPointerLeave={() => linkingActive && onLinkHover(null)}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-ink rounded-full" />
        <div className="absolute left-0 top-0 h-[10px] w-[2px] bg-ink rounded-sm" />
        <div className="absolute right-0 top-0 h-[10px] w-[2px] bg-ink rounded-sm" />
      </div>
    );
  }

  // MILESTONE rendering: diamond
  if (isMilestone) {
    const size = rowHeight - 14;
    return (
      <div
        className="absolute group cursor-pointer"
        style={{
          left: startOffset - size / 2 + dayWidth / 2,
          top: rowHeight / 2 - size / 2,
          width: size,
          height: size,
        }}
        onPointerDown={onPointerDown("move")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onSelect}
        onDoubleClick={onEdit}
        onPointerEnter={() => linkingActive && onLinkHover(task.id)}
        onPointerLeave={() => linkingActive && onLinkHover(null)}
      >
        <div
          className={clsx(
            "absolute inset-0 rotate-45 rounded-sm shadow-bar transition-shadow",
            selected && "ring-2 ring-offset-2 ring-offset-paper ring-ink",
          )}
          style={{ background: color }}
        />
        <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs whitespace-nowrap font-medium text-ink-soft">
          {task.name}
        </span>
      </div>
    );
  }

  // NORMAL bar
  const barH = Math.max(rowHeight - 14, 18);
  const barTop = (rowHeight - barH) / 2;

  return (
    <div
      className="absolute group"
      style={{ left: startOffset, width, top: barTop, height: barH }}
      onPointerEnter={() => linkingActive && onLinkHover(task.id)}
      onPointerLeave={() => linkingActive && onLinkHover(null)}
    >
      {/* The bar body */}
      <div
        className={clsx(
          "absolute inset-0 rounded-md shadow-bar overflow-hidden transition-shadow",
          drag === "move" && "animate-[pulse-soft_1s_ease-in-out_infinite]",
          selected && "ring-2 ring-offset-2 ring-offset-paper ring-ink",
        )}
        style={{ background: color }}
        onPointerDown={onPointerDown("move")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onSelect}
        onDoubleClick={onEdit}
      >
        {/* Progress fill */}
        {task.progress > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-ink/25 pointer-events-none"
            style={{ width: `${task.progress}%` }}
          />
        )}
        {/* Inner stripes for not-started */}
        {task.progress === 0 && (
          <div className="absolute inset-0 opacity-15 pointer-events-none"
               style={{
                 backgroundImage:
                   "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0 4px, transparent 4px 8px)",
               }} />
        )}
        {/* Label */}
        {width >= 48 && (
          <span className="relative z-10 px-2 h-full flex items-center text-xs font-medium text-paper truncate select-none pointer-events-none mix-blend-normal">
            {task.name}
            {task.progress > 0 && (
              <span className="ml-2 font-mono text-[10px] opacity-80">{task.progress}%</span>
            )}
          </span>
        )}
      </div>

      {/* Resize handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
        onPointerDown={onPointerDown("resize-left")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3 w-0.5 bg-paper/80 rounded-full" />
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
        onPointerDown={onPointerDown("resize-right")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-0.5 bg-paper/80 rounded-full" />
      </div>

      {/* Linking handles */}
      <button
        className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-paper border-2 border-ink opacity-0 group-hover:opacity-100 hover:scale-125 transition cursor-crosshair"
        onPointerDown={handleLinkStart("left")}
        title="Conectar (predecesor)"
        data-no-export="true"
      />
      <button
        className="absolute -right-[7px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-paper border-2 border-ink opacity-0 group-hover:opacity-100 hover:scale-125 transition cursor-crosshair"
        onPointerDown={handleLinkStart("right")}
        title="Conectar (sucesor)"
        data-no-export="true"
      />

      {/* Highlight when valid drop target during linking */}
      {linkingActive && (
        <div
          className="absolute inset-0 rounded-md ring-2 ring-accent/0 hover:ring-accent pointer-events-none"
          style={{ pointerEvents: "none" }}
        />
      )}
    </div>
  );
}
