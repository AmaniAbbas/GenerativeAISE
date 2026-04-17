"use client";

import { Expense } from "@/lib/types";
import { getMonthlySummaries, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  expenses: Expense[];
  isLoaded: boolean;
}

export function SpendingChart({ expenses, isLoaded }: Props) {
  const { currency } = useCurrency();
  const data = getMonthlySummaries(expenses);
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-100 rounded mb-6" />
        <div className="flex items-end gap-3 h-40">
          {[60, 80, 45, 90, 70, 100].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Monthly Spending</h3>
          <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Highest</p>
          <p className="text-sm font-semibold text-slate-700">{formatCurrency(maxVal, currency)}</p>
        </div>
      </div>

      <div className="flex items-end gap-2 h-44">
        {data.map((item, i) => {
          const height = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
          const isCurrentMonth = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  {formatCurrency(item.total, currency)}
                </div>
              </div>

              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: "152px" }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 cursor-pointer"
                  style={{
                    height: `${Math.max(height, item.total > 0 ? 4 : 0)}%`,
                    background: isCurrentMonth
                      ? "linear-gradient(to top, #4f46e5, #818cf8)"
                      : "linear-gradient(to top, #e0e7ff, #c7d2fe)",
                    minHeight: item.total > 0 ? "4px" : "0",
                  }}
                />
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium ${
                  isCurrentMonth ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
