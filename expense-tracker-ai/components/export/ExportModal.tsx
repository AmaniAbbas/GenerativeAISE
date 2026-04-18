"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Expense, Category } from "@/lib/types";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExportFormat, ExportConfig, applyExportFilters, runExport } from "@/lib/exportV2";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

const FORMAT_META: Record<ExportFormat, { label: string; ext: string; description: string; iconPath: string; ring: string; bg: string; text: string }> = {
  csv: {
    label: "CSV",
    ext: ".csv",
    description: "Spreadsheet-ready",
    iconPath: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z",
    ring: "ring-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  json: {
    label: "JSON",
    ext: ".json",
    description: "Developer-friendly",
    iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
    ring: "ring-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  pdf: {
    label: "PDF",
    ext: ".pdf",
    description: "Print-ready report",
    iconPath: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    ring: "ring-rose-400",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
};

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function defaultFilename() {
  const d = new Date().toISOString().split("T")[0];
  return `expenses-${d}`;
}

export function ExportModal({ isOpen, onClose, expenses }: Props) {
  const { currency } = useCurrency();

  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(CATEGORIES));
  const [filename, setFilename] = useState(defaultFilename);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormat("csv");
      setDateFrom("");
      setDateTo("");
      setSelectedCategories(new Set(CATEGORIES));
      setFilename(defaultFilename());
      setIsExporting(false);
      setExported(false);
    }
  }, [isOpen]);

  const preview = useMemo(
    () =>
      applyExportFilters(expenses, {
        dateFrom,
        dateTo,
        categories: Array.from(selectedCategories),
      }),
    [expenses, dateFrom, dateTo, selectedCategories]
  );

  const previewTotal = useMemo(
    () => preview.reduce((s, e) => s + e.amount, 0),
    [preview]
  );

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedCategories((prev) =>
      prev.size === CATEGORIES.length ? new Set() : new Set(CATEGORIES)
    );
  }, []);

  const handleExport = async () => {
    if (preview.length === 0) return;
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 600));
    const config: ExportConfig = {
      format,
      dateFrom,
      dateTo,
      categories: Array.from(selectedCategories),
      filename: filename.trim() || defaultFilename(),
    };
    runExport(preview, config);
    setIsExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  if (!isOpen) return null;

  const allSelected = selectedCategories.size === CATEGORIES.length;
  const noneSelected = selectedCategories.size === 0;
  const meta = FORMAT_META[format];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl animate-in flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Export expenses"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Export Expenses</h2>
              <p className="text-xs text-slate-500">Configure and download your data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: two-column layout */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

          {/* ─── Left: Configuration Panel ─── */}
          <div className="lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-5 space-y-5">

            {/* Format selector */}
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["csv", "json", "pdf"] as ExportFormat[]).map((f) => {
                  const m = FORMAT_META[f];
                  const active = format === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        active
                          ? `border-indigo-500 ${m.bg} ring-2 ring-indigo-200`
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? m.bg : "bg-slate-100"}`}>
                        <svg className={`w-4 h-4 ${active ? m.text : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={m.iconPath} />
                        </svg>
                      </div>
                      <span className={`text-xs font-bold ${active ? "text-indigo-700" : "text-slate-600"}`}>{m.label}</span>
                      <span className={`text-[10px] leading-tight ${active ? "text-indigo-500" : "text-slate-400"}`}>{m.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Date range */}
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || getTodayISO()}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 mb-1 block">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    max={getTodayISO()}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </section>

            {/* Category filter */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Categories
                </label>
                <button
                  onClick={toggleAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const checked = selectedCategories.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left ${
                        checked
                          ? "border-slate-200 bg-white"
                          : "border-transparent bg-slate-50 opacity-50"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors"
                        style={checked ? { background: cfg.color, borderColor: cfg.color } : { borderColor: "#cbd5e1" }}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{cfg.icon}</span>
                      <span className="text-sm text-slate-700 font-medium">{cat}</span>
                    </button>
                  );
                })}
              </div>
              {noneSelected && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-3 py-2">
                  Select at least one category to export.
                </p>
              )}
            </section>

            {/* Filename */}
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                File Name
              </label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="expenses-export"
                  className="flex-1 px-3 py-2 rounded-l-xl border border-r-0 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <span className="px-3 py-2 rounded-r-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 font-mono">
                  {meta.ext}
                </span>
              </div>
            </section>

            {/* Summary card */}
            <div className={`rounded-2xl p-4 border-2 transition-colors ${
              preview.length > 0 ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200"
            }`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Export Summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-2xl font-bold text-slate-900">{preview.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">records</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-lg font-bold text-indigo-600 truncate">
                    {formatCurrency(previewTotal, currency)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">total</p>
                </div>
              </div>
              {dateFrom || dateTo ? (
                <p className="text-xs text-slate-500 mt-2">
                  {dateFrom || "—"} → {dateTo || "today"}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">All dates included</p>
              )}
            </div>
          </div>

          {/* ─── Right: Preview Panel ─── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-semibold text-slate-700">Data Preview</span>
                {preview.length > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                    {preview.length} rows
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {format.toUpperCase()} format
              </span>
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-auto">
              {preview.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No records match</p>
                  <p className="text-xs text-slate-400 mt-1">Adjust your filters to see data here</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Description</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:table-cell">Category</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((e, i) => {
                      const cfg = CATEGORY_CONFIG[e.category];
                      return (
                        <tr
                          key={e.id}
                          className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}
                        >
                          <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap font-mono">
                            {formatDate(e.date)}
                          </td>
                          <td className="px-4 py-3 text-slate-800 font-medium max-w-[180px] truncate">
                            {e.description}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                              style={{ background: cfg.bgColor, color: cfg.color }}
                            >
                              <span>{cfg.icon}</span>
                              {e.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatCurrency(e.amount, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                      <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-600">
                        Total · {preview.length} record{preview.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-700 tabular-nums text-sm">
                        {formatCurrency(previewTotal, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer: action buttons */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl shrink-0">
          <p className="text-xs text-slate-400 hidden sm:block">
            {preview.length > 0
              ? `${preview.length} record${preview.length !== 1 ? "s" : ""} · ${meta.ext} file · ${filename || "expenses-export"}${meta.ext}`
              : "No records selected"}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || preview.length === 0 || noneSelected}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                exported
                  ? "bg-emerald-500 text-white"
                  : preview.length === 0 || noneSelected
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Exporting…
                </>
              ) : exported ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Downloaded!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export {meta.label}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
