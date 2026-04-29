"use client";

import { useState } from "react";
import type { Task, TaskId } from "@/lib/types";

interface Props {
  tasks: Task[];
  visibleOrder: TaskId[];
  /** Left edge x for a date's column (matches the bar's leftX in GanttChart). */
  leftX: (iso: string) => number;
  /** Right edge x for a date's column (matches the bar's rightX in GanttChart). */
  rightX: (iso: string) => number;
  rowHeight: number;
  totalWidth: number;
  totalHeight: number;
  onRemove: (from: TaskId, to: TaskId) => void;
  /** Pending linking ghost — rendered while user drags from a handle */
  pending?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  } | null;
}

export default function DependencyArrows({
  tasks,
  visibleOrder,
  leftX,
  rightX,
  rowHeight,
  totalWidth,
  totalHeight,
  onRemove,
  pending,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const rowIndex = new Map<TaskId, number>();
  visibleOrder.forEach((id, i) => rowIndex.set(id, i));

  const arrows: { key: string; from: TaskId; to: TaskId; d: string; arrow: { x: number; y: number } }[] = [];

  for (const task of tasks) {
    const toIdx = rowIndex.get(task.id);
    if (toIdx === undefined) continue;
    for (const fromId of task.dependencies) {
      const pred = tasks.find((t) => t.id === fromId);
      const fromIdx = rowIndex.get(fromId);
      if (!pred || fromIdx === undefined) continue;

      const srcX = rightX(pred.end);
      const srcY = fromIdx * rowHeight + rowHeight / 2;
      const dstX = leftX(task.start);
      const dstY = toIdx * rowHeight + rowHeight / 2;

      const d = buildPath(srcX, srcY, dstX, dstY);
      arrows.push({
        key: `${fromId}->${task.id}`,
        from: fromId,
        to: task.id,
        d,
        arrow: { x: dstX, y: dstY },
      });
    }
  }

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={totalWidth}
      height={totalHeight}
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="dep-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2A2F3A" />
        </marker>
        <marker
          id="dep-arrow-hover"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#C2410C" />
        </marker>
      </defs>

      {arrows.map((a) => (
        <g
          key={a.key}
          className="pointer-events-auto cursor-pointer"
          onPointerEnter={() => setHover(a.key)}
          onPointerLeave={() => setHover(null)}
          onClick={() => onRemove(a.from, a.to)}
        >
          {/* invisible wide hit area */}
          <path d={a.d} fill="none" stroke="transparent" strokeWidth={10} />
          {/* visible stroke */}
          <path
            d={a.d}
            fill="none"
            stroke={hover === a.key ? "#C2410C" : "#2A2F3A"}
            strokeWidth={hover === a.key ? 1.75 : 1.25}
            strokeLinecap="round"
            markerEnd={hover === a.key ? "url(#dep-arrow-hover)" : "url(#dep-arrow)"}
            opacity={hover === a.key ? 1 : 0.7}
          />
          {hover === a.key && (
            <g transform={`translate(${a.arrow.x - 42}, ${a.arrow.y - 22})`}>
              <rect width={36} height={16} rx={3} fill="#C2410C" />
              <text x={18} y={11} textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#FAFAF7">
                borrar
              </text>
            </g>
          )}
        </g>
      ))}

      {pending && (
        <path
          d={buildPath(pending.fromX, pending.fromY, pending.toX, pending.toY)}
          fill="none"
          stroke="#C2410C"
          strokeWidth={1.75}
          strokeDasharray="4 3"
          strokeLinecap="round"
          markerEnd="url(#dep-arrow-hover)"
        />
      )}
    </svg>
  );
}

function buildPath(srcX: number, srcY: number, dstX: number, dstY: number): string {
  const horizontalGap = Math.max(20, Math.abs(dstX - srcX) / 3);
  // If destination is to the right and below/above, use a smooth S-curve
  if (dstX >= srcX) {
    return `M ${srcX} ${srcY} C ${srcX + horizontalGap} ${srcY}, ${dstX - horizontalGap} ${dstY}, ${dstX} ${dstY}`;
  }
  // backward dependency: route around
  const turn = 24;
  const midY = (srcY + dstY) / 2;
  return `M ${srcX} ${srcY}
          L ${srcX + turn} ${srcY}
          L ${srcX + turn} ${midY}
          L ${dstX - turn} ${midY}
          L ${dstX - turn} ${dstY}
          L ${dstX} ${dstY}`.replace(/\s+/g, " ");
}
