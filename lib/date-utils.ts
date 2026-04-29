import {
  addDays,
  differenceInCalendarDays,
  format,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** Format a Date to ISO date string YYYY-MM-DD (local) */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(s: string): Date {
  return parseISO(s);
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(fromISO(b), fromISO(a));
}

export function shiftISO(s: string, days: number): string {
  return toISODate(addDays(fromISO(s), days));
}

export function todayISO(): string {
  return toISODate(new Date());
}

export interface TimelineRange {
  start: Date;
  end: Date;
  totalDays: number;
}

export function buildRange(
  taskStarts: string[],
  taskEnds: string[],
  fallbackStart: string,
  paddingBefore = 7,
  paddingAfter = 14,
  minDays = 30,
): TimelineRange {
  let start: Date;
  let end: Date;
  if (taskStarts.length === 0) {
    start = fromISO(fallbackStart);
    end = addDays(start, minDays);
  } else {
    const starts = taskStarts.map(fromISO).map((d) => d.getTime());
    const ends = taskEnds.map(fromISO).map((d) => d.getTime());
    start = new Date(Math.min(...starts));
    end = new Date(Math.max(...ends));
  }
  start = addDays(start, -paddingBefore);
  end = addDays(end, paddingAfter);
  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, minDays);
  return { start, end, totalDays };
}

export function eachDay(range: TimelineRange): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < range.totalDays; i++) {
    days.push(addDays(range.start, i));
  }
  return days;
}

export function groupByMonth(days: Date[]): { label: string; span: number }[] {
  const out: { label: string; span: number }[] = [];
  for (const d of days) {
    const label = format(startOfMonth(d), "MMMM yyyy");
    const last = out[out.length - 1];
    if (last && last.label === label) last.span += 1;
    else out.push({ label, span: 1 });
  }
  return out;
}

export function groupByWeek(days: Date[]): { label: string; span: number }[] {
  const out: { label: string; span: number }[] = [];
  for (const d of days) {
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    const label = `S${format(ws, "I")}`;
    const last = out[out.length - 1];
    if (last && last.label === label) last.span += 1;
    else out.push({ label, span: 1 });
  }
  return out;
}

export { format, isWeekend };

/** Step `n` calendar or visible days (skipping weekends when hideWeekends). */
export function advanceDays(
  iso: string,
  n: number,
  hideWeekends: boolean,
): string {
  if (!hideWeekends || n === 0) return shiftISO(iso, n);
  let d = fromISO(iso);
  let remaining = Math.abs(n);
  const dir = n > 0 ? 1 : -1;
  while (remaining > 0) {
    d = addDays(d, dir);
    if (!isWeekend(d)) remaining--;
  }
  return toISODate(d);
}
