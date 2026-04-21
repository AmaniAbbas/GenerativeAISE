"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Expense, Category } from "@/lib/types";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency, getCategorySummaries } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";

interface CategoryDonutChartProps {
  expenses: Expense[];
  isLoaded: boolean;
}

export function CategoryDonutChart({ expenses, isLoaded }: CategoryDonutChartProps) {
  const { currency } = useCurrency();
  const summaries = getCategorySummaries(expenses);

  const data = summaries.map((s) => ({
    name: s.category,
    value: s.total,
    percentage: s.percentage,
  }));

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-36 mb-1" />
        <div className="h-3 bg-slate-100 rounded w-24 mb-6" />
        <div className="flex gap-6 items-center">
          <div className="w-36 h-36 bg-slate-100 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">Category Breakdown</h3>
        <p className="text-xs text-slate-400 mt-0.5">All-time distribution</p>
      </div>

      {summaries.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
          No spending data yet
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={CATEGORY_CONFIG[entry.name as Category]?.color ?? "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const cat = payload[0]?.name as Category;
                    const value = payload[0]?.value;
                    if (typeof value !== "number") return null;
                    const config = CATEGORY_CONFIG[cat];
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl text-sm shadow-xl">
                        <p className="text-slate-300 text-xs font-medium mb-0.5">
                          {config?.icon} {cat}
                        </p>
                        <p className="font-semibold">{formatCurrency(value, currency)}</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {summaries.map((s) => {
              const config = CATEGORY_CONFIG[s.category];
              return (
                <div key={s.category} className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-slate-600 flex-1 font-medium">
                    {config.icon} {s.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    {formatCurrency(s.total, currency)}
                  </span>
                  <span className="text-xs text-slate-400 w-9 text-right">
                    {s.percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
