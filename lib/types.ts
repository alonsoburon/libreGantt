export type TaskId = string;

export type TimeScale = "day" | "week" | "month";

export interface Task {
  id: TaskId;
  name: string;
  /** Inclusive start date in YYYY-MM-DD */
  start: string;
  /** Inclusive end date in YYYY-MM-DD */
  end: string;
  /** 0..100 */
  progress: number;
  parentId: TaskId | null;
  dependencies: TaskId[];
  color?: string;
  collapsed?: boolean;
  notes?: string;
  /** Optional monetary budget (raw number, currency-agnostic) */
  budget?: number;
}

export interface Project {
  name: string;
  description?: string;
  /** YYYY-MM-DD */
  startDate: string;
}

export interface GanttData {
  project: Project;
  tasks: Task[];
  /** ordered list of task ids — defines row order */
  order: TaskId[];
}

export const TASK_COLORS = [
  "#C2410C", // terracotta
  "#1E3A5F", // marine
  "#4F6F52", // moss
  "#7C3AED", // violet
  "#B45309", // amber
  "#0E7490", // teal
  "#BE185D", // magenta
  "#15803D", // emerald
  "#1D4ED8", // royal blue
  "#A16207", // ochre
  "#9333EA", // purple
  "#0F766E", // pine
  "#DC2626", // red
  "#65A30D", // lime
  "#0369A1", // sky
  "#7E22CE", // grape
] as const;
