import { jsPDF } from "jspdf";

export type DownloadSummaryPdfParams = {
  topic: string;
  mode: string;
  model: string;
  text: string;
};

/**
 * Builds and returns the PDF as a `Blob` without triggering any download.
 * Callers are responsible for creating an object URL and revoking it.
 */
export function buildSummaryPdfBlob({ topic, mode, model, text }: DownloadSummaryPdfParams): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const usableWidth = pageWidth - margin * 2;

  let y = 20;

  // ── Title ──────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("Topic Summary", margin, y);
  y += 12;

  // ── Metadata ───────────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);

  doc.setFont("helvetica", "bold");
  doc.text(`Topic: ${topic}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text(`Mode: ${mode}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text(`Model: ${model}`, margin, y);
  y += 12;

  // ── Generated text (no sources / URLs) ────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(text, usableWidth);
  doc.text(lines, margin, y);

  return doc.output("blob");
}

/**
 * @deprecated Use `buildSummaryPdfBlob` and an `<a href download>` element
 * instead to ensure browser download events fire correctly.
 *
 * Generates and immediately downloads `topic-summary.pdf` via a programmatic
 * anchor click. Kept for backward compatibility.
 */
export function downloadSummaryPdf(params: DownloadSummaryPdfParams): void {
  const blob = buildSummaryPdfBlob(params);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "topic-summary.pdf";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
