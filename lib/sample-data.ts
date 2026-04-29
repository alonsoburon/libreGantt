import type { GanttData } from "./types";
import { shiftISO, todayISO } from "./date-utils";

export function createSampleData(): GanttData {
  const t = todayISO();
  const tasks = [
    {
      id: "t-discovery",
      name: "Descubrimiento",
      start: shiftISO(t, 0),
      end: shiftISO(t, 4),
      progress: 100,
      parentId: null,
      dependencies: [],
      color: "#1E3A5F",
    },
    {
      id: "t-interviews",
      name: "Entrevistas con stakeholders",
      start: shiftISO(t, 0),
      end: shiftISO(t, 2),
      progress: 100,
      parentId: "t-discovery",
      dependencies: [],
      budget: 800000,
    },
    {
      id: "t-requirements",
      name: "Documento de requerimientos",
      start: shiftISO(t, 2),
      end: shiftISO(t, 4),
      progress: 80,
      parentId: "t-discovery",
      dependencies: ["t-interviews"],
      budget: 600000,
    },
    {
      id: "t-design",
      name: "Diseño",
      start: shiftISO(t, 5),
      end: shiftISO(t, 12),
      progress: 40,
      parentId: null,
      dependencies: ["t-discovery"],
      color: "#C2410C",
    },
    {
      id: "t-wireframes",
      name: "Wireframes",
      start: shiftISO(t, 5),
      end: shiftISO(t, 8),
      progress: 60,
      parentId: "t-design",
      dependencies: [],
      budget: 1200000,
    },
    {
      id: "t-mockups",
      name: "Mockups de alta fidelidad",
      start: shiftISO(t, 8),
      end: shiftISO(t, 12),
      progress: 20,
      parentId: "t-design",
      dependencies: ["t-wireframes"],
      budget: 1800000,
    },
    {
      id: "t-build",
      name: "Construcción",
      start: shiftISO(t, 13),
      end: shiftISO(t, 28),
      progress: 0,
      parentId: null,
      dependencies: ["t-design"],
      color: "#4F6F52",
      budget: 6500000,
    },
    {
      id: "t-launch",
      name: "Lanzamiento",
      start: shiftISO(t, 30),
      end: shiftISO(t, 30),
      progress: 0,
      parentId: null,
      dependencies: ["t-build"],
      color: "#7C3AED",
      budget: 500000,
    },
  ];

  return {
    project: {
      name: "Proyecto demo",
      description: "Plantilla inicial — edita o elimina las tareas",
      startDate: t,
    },
    tasks,
    order: tasks.map((t) => t.id),
  };
}
