import { jsPDF } from "jspdf";
import type { InspectionRecord } from "@shared/inspection";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(record: InspectionRecord) {
  download(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }), `${record.id}-inspection.json`);
}

export function downloadCsv(record: InspectionRecord) {
  const rows = [
    ["Field", "Value"],
    ["Inspection ID", record.id],
    ["Brand", record.brand],
    ["Status", record.status],
    ["Compliance score", `${record.complianceScore}%`],
    ...Object.entries(record.extractedData).map(([key, value]) => [key, String(value ?? "")]),
    ...record.evaluation.results.map(item => [`Rule: ${item.title}`, `${item.state} — ${item.message}`]),
  ];
  const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${record.id}-inspection.csv`);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imageDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Image evidence cannot be loaded for the report.");
  return blobToBase64(await response.blob());
}

export async function createPdfReport(record: InspectionRecord): Promise<{ blob: Blob; data: string; filename: string }> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const dark = "#14150f";
  const lime = "#c8ff00";
  doc.setFillColor(lime);
  doc.rect(0, 0, pageWidth, 54, "F");
  doc.setTextColor(dark);
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("METROLOGIC / INSPECTION NOTICE", margin, 33);
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text("Packaged Commodity Compliance Report", margin, 90);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.text(`Inspection: ${record.id}    Issued: ${new Date(record.createdAt).toLocaleString()}`, margin, 112);
  doc.setFillColor(record.status === "COMPLIANT" ? "#d9f99d" : record.status === "PARTIAL_VIOLATION" ? "#fde68a" : "#fecaca");
  doc.roundedRect(margin, 132, pageWidth - margin * 2, 36, 2, 2, "F");
  doc.setTextColor(dark);
  doc.setFont("courier", "bold");
  doc.text(`${record.status.replaceAll("_", " ")}  /  ${record.complianceScore}% COMPLIANCE`, margin + 12, 155);
  let y = 194;
  if (record.evidence[0]?.url) {
    try {
      const image = await imageDataUrl(record.evidence[0].url);
      const format = record.evidence[0].contentType === "image/png" ? "PNG" : record.evidence[0].contentType === "image/webp" ? "WEBP" : "JPEG";
      doc.addImage(`data:${record.evidence[0].contentType};base64,${image}`, format, margin, y, 150, 112);
    } catch {
      doc.setDrawColor("#999999");
      doc.rect(margin, y, 150, 112);
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.text("Evidence image retained in record", margin + 12, y + 24);
    }
  }
  const dataX = record.evidence[0]?.url ? margin + 172 : margin;
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.text("EXTRACTED DECLARATIONS", dataX, y + 12);
  doc.setFont("courier", "normal");
  const fields = Object.entries(record.extractedData).slice(0, 9);
  fields.forEach(([key, value], index) => {
    doc.text(`${key.replaceAll("_", " ")}: ${String(value ?? "—")}`, dataX, y + 31 + index * 14, { maxWidth: pageWidth - dataX - margin });
  });
  y += 142;
  doc.setFont("courier", "bold");
  doc.text("RULE EVALUATION", margin, y);
  y += 17;
  doc.setFont("courier", "normal");
  record.evaluation.results.forEach(item => {
    const prefix = item.state === "PASS" ? "PASS" : item.state === "WARNING" ? "WARN" : "FAIL";
    const text = `${prefix}  ${item.title}: ${item.message}`;
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 5;
  });
  y += 10;
  doc.setFont("courier", "bold");
  doc.text("OFFICIAL NOTES", margin, y);
  doc.setFont("courier", "normal");
  doc.text(doc.splitTextToSize(record.inspectorNotes || "No additional inspector notes.", pageWidth - margin * 2), margin, y + 18);
  const blob = doc.output("blob");
  return { blob, data: await blobToBase64(blob), filename: `${record.id}-inspection-report.pdf` };
}

export function downloadPdf(blob: Blob, filename: string) {
  download(blob, filename);
}
