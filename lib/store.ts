"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GanttData, Task, TaskId, Project, TimeScale } from "./types";
import { createSampleData } from "./sample-data";
import { todayISO } from "./date-utils";

interface State extends GanttData {
  selectedId: TaskId | null;
  scale: TimeScale;
  showDependencies: boolean;
  showWeekends: boolean;
  fontScale: number;
}

interface Actions {
  setProject: (patch: Partial<Project>) => void;
  addTask: (parentId?: TaskId | null) => TaskId;
  updateTask: (id: TaskId, patch: Partial<Task>) => void;
  deleteTask: (id: TaskId) => void;
  duplicateTask: (id: TaskId) => void;
  moveRow: (id: TaskId, dir: -1 | 1) => void;
  indent: (id: TaskId) => void;
  outdent: (id: TaskId) => void;
  toggleCollapse: (id: TaskId) => void;
  select: (id: TaskId | null) => void;
  setScale: (s: TimeScale) => void;
  setShowDependencies: (v: boolean) => void;
  setShowWeekends: (v: boolean) => void;
  setFontScale: (n: number) => void;
  addDependency: (from: TaskId, to: TaskId) => void;
  removeDependency: (from: TaskId, to: TaskId) => void;
  loadData: (data: GanttData) => void;
  reset: () => void;
  /** Wipe everything and start fresh from a chosen date. */
  restartFromDate: (startDate: string, projectName?: string) => void;
}

const initial: GanttData = createSampleData();

function uid(): string {
  return "t-" + Math.random().toString(36).slice(2, 9);
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      selectedId: null,
      scale: "day",
      showDependencies: true,
      showWeekends: true,
      fontScale: 1,

      setProject: (patch) =>
        set((s) => ({ project: { ...s.project, ...patch } })),

      addTask: (parentId = null) => {
        const id = uid();
        const t = todayISO();
        const newTask: Task = {
          id,
          name: "Nueva tarea",
          start: t,
          end: t,
          progress: 0,
          parentId: parentId ?? null,
          dependencies: [],
        };
        set((s) => {
          // Insert after parent (or its last descendant), else at end
          let insertIdx = s.order.length;
          if (parentId) {
            const parentIdx = s.order.indexOf(parentId);
            if (parentIdx !== -1) {
              insertIdx = parentIdx + 1;
              // skip past existing children
              while (
                insertIdx < s.order.length &&
                isDescendantOf(s.tasks, s.order[insertIdx], parentId)
              ) {
                insertIdx++;
              }
            }
          }
          const order = [...s.order];
          order.splice(insertIdx, 0, id);
          return {
            tasks: [...s.tasks, newTask],
            order,
            selectedId: id,
          };
        });
        return id;
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTask: (id) =>
        set((s) => {
          const toRemove = new Set<TaskId>([id]);
          // cascade descendants
          let changed = true;
          while (changed) {
            changed = false;
            for (const t of s.tasks) {
              if (t.parentId && toRemove.has(t.parentId) && !toRemove.has(t.id)) {
                toRemove.add(t.id);
                changed = true;
              }
            }
          }
          return {
            tasks: s.tasks
              .filter((t) => !toRemove.has(t.id))
              .map((t) => ({
                ...t,
                dependencies: t.dependencies.filter((d) => !toRemove.has(d)),
              })),
            order: s.order.filter((x) => !toRemove.has(x)),
            selectedId: s.selectedId && toRemove.has(s.selectedId) ? null : s.selectedId,
          };
        }),

      duplicateTask: (id) => {
        const src = get().tasks.find((t) => t.id === id);
        if (!src) return;
        const newId = uid();
        const copy: Task = {
          ...src,
          id: newId,
          name: src.name + " (copia)",
          dependencies: [],
        };
        set((s) => {
          const idx = s.order.indexOf(id);
          const order = [...s.order];
          order.splice(idx + 1, 0, newId);
          return { tasks: [...s.tasks, copy], order };
        });
      },

      moveRow: (id, dir) =>
        set((s) => {
          const idx = s.order.indexOf(id);
          if (idx === -1) return {};
          const target = idx + dir;
          if (target < 0 || target >= s.order.length) return {};
          const order = [...s.order];
          [order[idx], order[target]] = [order[target], order[idx]];
          return { order };
        }),

      indent: (id) =>
        set((s) => {
          const idx = s.order.indexOf(id);
          if (idx <= 0) return {};
          const prevId = s.order[idx - 1];
          // can only indent under a sibling at same parent
          const me = s.tasks.find((t) => t.id === id);
          const prev = s.tasks.find((t) => t.id === prevId);
          if (!me || !prev) return {};
          if (me.parentId !== prev.parentId) return {};
          return {
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, parentId: prevId } : t,
            ),
          };
        }),

      outdent: (id) =>
        set((s) => {
          const me = s.tasks.find((t) => t.id === id);
          if (!me || !me.parentId) return {};
          const parent = s.tasks.find((t) => t.id === me.parentId);
          if (!parent) return {};
          return {
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, parentId: parent.parentId } : t,
            ),
          };
        }),

      toggleCollapse: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, collapsed: !t.collapsed } : t,
          ),
        })),

      select: (id) => set({ selectedId: id }),
      setScale: (s) => set({ scale: s }),
      setShowDependencies: (v) => set({ showDependencies: v }),
      setShowWeekends: (v) => set({ showWeekends: v }),
      setFontScale: (n) => set({ fontScale: Math.min(1.5, Math.max(0.8, n)) }),

      addDependency: (from, to) =>
        set((s) => {
          if (from === to) return {};
          // prevent duplicate
          const target = s.tasks.find((t) => t.id === to);
          if (!target) return {};
          if (target.dependencies.includes(from)) return {};
          // prevent direct cycle
          const source = s.tasks.find((t) => t.id === from);
          if (source && source.dependencies.includes(to)) return {};
          return {
            tasks: s.tasks.map((t) =>
              t.id === to
                ? { ...t, dependencies: [...t.dependencies, from] }
                : t,
            ),
          };
        }),

      removeDependency: (from, to) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === to
              ? { ...t, dependencies: t.dependencies.filter((d) => d !== from) }
              : t,
          ),
        })),

      loadData: (data) =>
        set({
          project: data.project,
          tasks: data.tasks,
          order: data.order ?? data.tasks.map((t) => t.id),
          selectedId: null,
        }),

      reset: () => {
        const fresh = createSampleData();
        set({
          project: fresh.project,
          tasks: fresh.tasks,
          order: fresh.order,
          selectedId: null,
        });
      },

      restartFromDate: (startDate, projectName) => {
        const seedId = "t-" + Math.random().toString(36).slice(2, 9);
        set((s) => ({
          project: {
            name: projectName ?? s.project.name,
            description: s.project.description,
            startDate,
          },
          tasks: [
            {
              id: seedId,
              name: "Primera tarea",
              start: startDate,
              end: startDate,
              progress: 0,
              parentId: null,
              dependencies: [],
            },
          ],
          order: [seedId],
          selectedId: null,
        }));
      },
    }),
    {
      name: "gantt-app-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        project: s.project,
        tasks: s.tasks,
        order: s.order,
        scale: s.scale,
        showDependencies: s.showDependencies,
        showWeekends: s.showWeekends,
        fontScale: s.fontScale,
      }),
    },
  ),
);

function isDescendantOf(tasks: Task[], id: TaskId, ancestor: TaskId): boolean {
  let cur = tasks.find((t) => t.id === id);
  while (cur && cur.parentId) {
    if (cur.parentId === ancestor) return true;
    cur = tasks.find((t) => t.id === cur!.parentId);
  }
  return false;
}

/** Visible tasks honoring collapsed parents */
export function selectVisibleOrder(state: State): TaskId[] {
  const collapsed = new Set(
    state.tasks.filter((t) => t.collapsed).map((t) => t.id),
  );
  const out: TaskId[] = [];
  for (const id of state.order) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) continue;
    let cur: Task | undefined = t;
    let hidden = false;
    while (cur && cur.parentId) {
      if (collapsed.has(cur.parentId)) {
        hidden = true;
        break;
      }
      cur = state.tasks.find((x) => x.id === cur!.parentId);
    }
    if (!hidden) out.push(id);
  }
  return out;
}

/** Get depth of a task in the hierarchy (0-based) */
export function getDepth(tasks: Task[], id: TaskId): number {
  let depth = 0;
  let cur = tasks.find((t) => t.id === id);
  while (cur && cur.parentId) {
    depth++;
    cur = tasks.find((t) => t.id === cur!.parentId);
  }
  return depth;
}

export function hasChildren(tasks: Task[], id: TaskId): boolean {
  return tasks.some((t) => t.parentId === id);
}

/** Recompute group bounds from children (returns possibly-modified task list) */
export function computeGroupBounds(tasks: Task[]): Task[] {
  const childMap = new Map<TaskId, Task[]>();
  for (const t of tasks) {
    if (t.parentId) {
      const list = childMap.get(t.parentId) ?? [];
      list.push(t);
      childMap.set(t.parentId, list);
    }
  }
  // For groups, derive start/end/progress from children
  return tasks.map((t) => {
    const children = childMap.get(t.id);
    if (!children || children.length === 0) return t;
    const start = children.reduce((m, c) => (c.start < m ? c.start : m), children[0].start);
    const end = children.reduce((m, c) => (c.end > m ? c.end : m), children[0].end);
    // weighted progress by duration
    const totalDays = children.reduce((s, c) => s + Math.max(1, daysBetween(c.start, c.end) + 1), 0);
    const done = children.reduce(
      (s, c) => s + (Math.max(1, daysBetween(c.start, c.end) + 1) * c.progress) / 100,
      0,
    );
    const progress = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0;
    return { ...t, start, end, progress };
  });
}

/** Sum of all descendants' budgets (recursive). Returns undefined if no descendant has a budget. */
export function rolledUpBudget(tasks: Task[], id: TaskId): number | undefined {
  const childMap = new Map<TaskId, Task[]>();
  for (const t of tasks) {
    if (t.parentId) {
      const list = childMap.get(t.parentId) ?? [];
      list.push(t);
      childMap.set(t.parentId, list);
    }
  }
  let total = 0;
  let found = false;
  const walk = (taskId: TaskId) => {
    const kids = childMap.get(taskId);
    if (!kids || kids.length === 0) return;
    for (const k of kids) {
      const grand = childMap.get(k.id);
      if (grand && grand.length > 0) {
        walk(k.id);
      } else if (typeof k.budget === "number") {
        total += k.budget;
        found = true;
      }
    }
  };
  walk(id);
  return found ? total : undefined;
}

function daysBetween(a: string, b: string): number {
  // local helper to avoid circular import
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
