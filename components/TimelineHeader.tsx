"use client";

import {
  eachDay,
  format,
  groupByMonth,
  isWeekend,
  type TimelineRange,
} from "@/lib/date-utils";
import type { TimeScale } from "@/lib/types";
import { startOfWeek, getISOWeek, getDate, isFirstDayOfMonth } from "date-fns";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

interface Props {
  range: TimelineRange;
  scale: TimeScale;
  dayWidth: number;
  todayX: number | null;
  /** Same dayInfo computed in GanttChart so headers and grid stay aligned. */
  dayInfo: {
    visible: boolean[];
    prefix: number[];
    visibleCount: number;
  };
}

const HEADER_TOP_H = 26;
const HEADER_BOTTOM_H = 30;
export const TIMELINE_HEADER_H = HEADER_TOP_H + HEADER_BOTTOM_H;

export default function TimelineHeader({
  range,
  scale,
  dayWidth,
  todayX,
  dayInfo,
}: Props) {
  const t = useT();
  const showWeekends = useStore((s) => s.showWeekends);
  const allDays = eachDay(range);
  const days = allDays.filter((_, i) => dayInfo.visible[i]);
  const months = groupByMonth(days);
  const totalWidth = dayInfo.visibleCount * dayWidth;

  return (
    <div
      className="relative border-b border-paper-line bg-paper-warm/40"
      style={{ width: totalWidth, height: TIMELINE_HEADER_H }}
    >
      {/* Months row */}
      <div className="flex" style={{ height: HEADER_TOP_H }}>
        {months.map((m, i) => (
          <div
            key={i}
            className="border-r border-paper-line/80 flex items-center px-2 font-display italic text-ink-soft text-sm capitalize"
            style={{ width: m.span * dayWidth }}
          >
            <span className="truncate">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Days row */}
      <div
        className="flex border-t border-paper-line/60"
        style={{ height: HEADER_BOTTOM_H }}
      >
        {days.map((d, i) => {
          const weekend = isWeekend(d);
          const dom = getDate(d);
          const isMonthStart = isFirstDayOfMonth(d);
          const isWeekStart = startOfWeek(d, { weekStartsOn: 1 }).toDateString() === d.toDateString();
          let label = "";
          let strong = false;
          if (scale === "day") {
            label = String(dom);
            strong = dom === 1;
          } else if (scale === "week") {
            if (isWeekStart) {
              label = `S${getISOWeek(d)}`;
              strong = true;
            }
          } else {
            if (isMonthStart) {
              label = format(d, "MMM").toUpperCase();
              strong = true;
            }
          }

          return (
            <div
              key={i}
              className={clsx(
                "shrink-0 border-r flex items-center justify-center font-mono text-[10px] tracking-tight",
                showWeekends && weekend ? "bg-paper-warm/70" : "",
                isMonthStart ? "border-ink/40" : "border-paper-line/50",
                strong ? "text-ink" : "text-ink-muted",
              )}
              style={{ width: dayWidth }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Today marker */}
      {todayX !== null && (
        <div
          className="absolute top-0 bottom-0 w-px bg-accent/70 pointer-events-none"
          style={{ left: todayX }}
        >
          <div className="absolute -top-px -translate-x-1/2 left-0 px-1 py-0.5 text-[9px] font-mono text-paper bg-accent rounded-sm">
            {t.today}
          </div>
        </div>
      )}
    </div>
  );
}
