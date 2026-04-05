import type { Group } from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

export function exportGroupToSTL(group: Group): ArrayBuffer {
  const exporter = new STLExporter();
  return exporter.parse(group, { binary: true }) as unknown as ArrayBuffer;
}

export function downloadSTL(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
