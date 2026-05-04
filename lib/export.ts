"use client";

import { toPng } from "html-to-image";
import jsPDF from "jspdf";

async function snapshot(node: HTMLElement): Promise<string> {
  // While snapshotting, expand the task list panel and remove name
  // truncation so column contents are fully readable in the export.
  node.classList.add("gantt-exporting");
  // Force layout to settle with the new styles before capturing.
  void node.offsetHeight;
  try {
    // Higher pixel ratio for crisp output
    return await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#FAFAF7",
      style: {
        // Preserve fonts in the export
        fontFamily: getComputedStyle(node).fontFamily,
      },
      filter: (n) => {
        // exclude elements explicitly marked as no-export
        if (n instanceof HTMLElement && n.dataset.noExport === "true") return false;
        return true;
      },
    });
  } finally {
    node.classList.remove("gantt-exporting");
  }
}

export async function exportPNG(node: HTMLElement, filename = "gantt.png") {
  const dataUrl = await snapshot(node);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPDF(node: HTMLElement, filename = "gantt.pdf") {
  const dataUrl = await snapshot(node);
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load snapshot image"));
  });

  const orientation = img.width >= img.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    format: [img.width, img.height],
    compress: true,
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  pdf.save(filename);
}

export function exportJSON(data: unknown, filename = "gantt.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
