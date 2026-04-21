import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { Expense, Currency } from "./types";
import { CATEGORY_CONFIG } from "./constants";
import { formatDate, formatCurrency, getCategorySummaries } from "./utils";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

export function exportToPDF(expenses: Expense[], currency: Currency = "USD"): void {
  if (expenses.length === 0) return;

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const summaries = getCategorySummaries(sorted);
  const totalAmount = sorted.reduce((sum, e) => sum + e.amount, 0);

  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const indigo = { r: 79, g: 70, b: 229 };

  // Header bar
  doc.setFillColor(indigo.r, indigo.g, indigo.b);
  doc.rect(0, 0, pageW, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SpendSmart", margin, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Expense Report", margin, 21);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  doc.text(`Generated ${dateStr}`, pageW - margin, 21, { align: "right" });

  // Summary bar
  let y = 38;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentW, 20, 3, 3, "FD");

  const colW = contentW / 3;
  const summaryItems = [
    { label: "TOTAL SPENT", value: formatCurrency(totalAmount, currency) },
    { label: "TRANSACTIONS", value: sorted.length.toString() },
    { label: "CATEGORIES", value: summaries.length.toString() },
  ];

  summaryItems.forEach((item, i) => {
    const x = margin + colW * i + colW / 2;
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(item.label, x, y + 7, { align: "center" });
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(item.value, x, y + 15, { align: "center" });
  });

  y = 66;

  // Category sections — ordered by total descending, expenses within by date descending
  for (const { category, total, count } of summaries) {
    const config = CATEGORY_CONFIG[category];
    const color = hexToRGB(config.color);
    const bg = hexToRGB(config.bgColor);
    const catExpenses = sorted.filter((e) => e.category === category);

    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }

    // Category header bar
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.setDrawColor(color.r, color.g, color.b);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, "FD");

    doc.setFillColor(color.r, color.g, color.b);
    doc.roundedRect(margin, y, 3, 10, 1, 1, "F");

    doc.setTextColor(color.r, color.g, color.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(category, margin + 7, y + 6.5);

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${count} transaction${count !== 1 ? "s" : ""}`, margin + 45, y + 6.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(formatCurrency(total, currency), pageW - margin, y + 6.5, { align: "right" });

    y += 11;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Description", "Amount"]],
      body: catExpenses.map((e) => [
        formatDate(e.date),
        e.description,
        formatCurrency(e.amount, currency),
      ]),
      theme: "plain",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [100, 116, 139],
        fontSize: 7.5,
        fontStyle: "normal",
        cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 8.5,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 28 },
        2: { cellWidth: 32, halign: "right" },
      },
      styles: {
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
        overflow: "linebreak",
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // Grand total bar
  if (y > pageH - 20) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(indigo.r, indigo.g, indigo.b);
  doc.roundedRect(margin, y, contentW, 13, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Grand Total", margin + 8, y + 8.5);
  doc.text(formatCurrency(totalAmount, currency), pageW - margin, y + 8.5, { align: "right" });

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 6, { align: "center" });
  }

  doc.save(`expenses-${now.toISOString().split("T")[0]}.pdf`);
}

export function exportToCSV(expenses: Expense[]): void {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map((e) => [
    esc(formatDate(e.date)),
    esc(e.category),
    esc(e.description),
    e.amount.toFixed(2),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
