"use client";

import { Expense } from "@/lib/types";
import { getCategorySummaries, formatCurrency } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  expenses: Expense[];
  isLoaded: boolean;
}

export function CategoryBreakdown({ expenses, isLoaded }: Props) {
  const { currency } = useCurrency();
  const summaries = getCategorySummaries(expenses);

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-36 bg-slate-100 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-2 bg-slate-100 rounded w-full" />
              </div>
              <div className="h-4 w-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">By Category</h3>
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">No data to display</p>
        </div>
      </div>
    );
  }

  // Build donut chart data
  const total = summaries.reduce((s, c) => s + c.total, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const segments = summaries.map((s) => {
    const pct = s.total / total;
    const dashArray = pct * circumference;
    const dashOffset = circumference * (1 - cumulativePercent);
    const segment = {
      ...s,
      dashArray,
      dashOffset,
      color: CATEGORY_CONFIG[s.category].color,
    };
    cumulativePercent += pct;
    return segment;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-900">By Category</h3>
        <span className="text-xs text-slate-400">{summaries.length} categories</span>
      </div>

      {/* Donut chart */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="20" />
            {segments.map((seg) => (
              <circle
                key={seg.category}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                className="transition-all duration-500"
                style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-slate-400 leading-none">Total</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(total, currency)}</p>
          </div>
        </div>

        {/* Top 3 legend */}
        <div className="flex-1 space-y-2">
          {summaries.slice(0, 4).map((s) => {
            const config = CATEGORY_CONFIG[s.category];
            return (
              <div key={s.category} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                <span className="text-xs text-slate-600 flex-1 truncate">{s.category}</span>
                <span className="text-xs font-semibold text-slate-900">{s.percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bar list */}
      <div className="space-y-3">
        {summaries.map((s) => {
          const config = CATEGORY_CONFIG[s.category];
          return (
            <div key={s.category} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{s.category}</span>
                  <span className="text-xs text-slate-400">{s.count} items</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(s.total, currency)}</span>
                  <span className="text-xs text-slate-400 ml-1.5">{s.percentage.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${s.percentage}%`, backgroundColor: config.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
