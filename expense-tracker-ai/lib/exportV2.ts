import { Expense, Category } from "./types";

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportConfig {
  format: ExportFormat;
  dateFrom: string;
  dateTo: string;
  categories: Category[];
  filename: string;
}

export function applyExportFilters(
  expenses: Expense[],
  config: Pick<ExportConfig, "dateFrom" | "dateTo" | "categories">
): Expense[] {
  return expenses.filter((e) => {
    const inDateRange =
      (!config.dateFrom || e.date >= config.dateFrom) &&
      (!config.dateTo || e.date <= config.dateTo);
    const inCategories =
      config.categories.length === 0 || config.categories.includes(e.category);
    return inDateRange && inCategories;
  });
}

export function runExport(expenses: Expense[], config: ExportConfig): void {
  switch (config.format) {
    case "csv":
      exportCSV(expenses, config.filename);
      break;
    case "json":
      exportJSON(expenses, config.filename);
      break;
    case "pdf":
      exportPDF(expenses, config.filename);
      break;
  }
}

function exportCSV(expenses: Expense[], filename: string): void {
  const headers = ["Date", "Description", "Category", "Amount (USD)"];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.amount.toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

function exportJSON(expenses: Expense[], filename: string): void {
  const payload = expenses.map(({ id: _id, createdAt: _c, ...rest }) => rest);
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${filename}.json`
  );
}

function exportPDF(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(buildPrintHTML(expenses, total, filename));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

function buildPrintHTML(expenses: Expense[], total: number, title: string): string {
  const rows = expenses
    .map(
      (e) => `<tr>
        <td>${e.date}</td>
        <td>${escapeHtml(e.description)}</td>
        <td>${e.category}</td>
        <td class="amount">$${e.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const generated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; padding: 40px; font-size: 13px; }
    .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
    .header p { color: #64748b; margin-top: 4px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; }
    th { padding: 10px 14px; text-align: left; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    td.amount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    th:last-child { text-align: right; }
    .total-row td { font-weight: 700; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 14px; background: #f8fafc; color: #0f172a; }
    .total-row td.amount { color: #6366f1; font-size: 15px; }
    .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 20px; } @page { margin: 1cm; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(title)}</h1>
    <p>Generated ${generated} &middot; ${expenses.length} record${expenses.length !== 1 ? "s" : ""}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Category</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td class="amount">$${total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  <p class="footer">SpendSmart Expense Report</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
