"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Expense, Category } from "@/lib/types";
import { useCurrency } from "@/context/CurrencyContext";
import {
  formatCurrency,
  getCategorySummaries,
  getCurrentMonthExpenses,
  getTotalAmount,
} from "@/lib/utils";
import { CATEGORY_CONFIG, MONTH_NAMES } from "@/lib/constants";

function computeBudgetStreak(expenses: Expense[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthExpenses = expenses.filter((e) => {
    const [y, m] = e.date.split("-").map(Number);
    return y === year && m - 1 === month;
  });

  if (monthExpenses.length === 0) return 0;

  const dailyBudget = getTotalAmount(monthExpenses) / today;

  const dailyMap = new Map<string, number>();
  monthExpenses.forEach((e) => {
    dailyMap.set(e.date, (dailyMap.get(e.date) ?? 0) + e.amount);
  });

  let streak = 0;
  for (let i = 0; i < today; i++) {
    const day = today - i;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if ((dailyMap.get(dateStr) ?? 0) <= dailyBudget) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

interface MonthlyInsightsProps {
  expenses: Expense[];
  isLoaded: boolean;
}

export function MonthlyInsights({ expenses, isLoaded }: MonthlyInsightsProps) {
  const { currency } = useCurrency();
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();

  const monthlyExpenses = getCurrentMonthExpenses(expenses);
  const summaries = getCategorySummaries(monthlyExpenses);
  const top3 = summaries.slice(0, 3);
  const streak = computeBudgetStreak(expenses);

  const donutData = summaries.map((s) => ({
    name: s.category,
    value: s.total,
  }));

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 animate-pulse max-w-sm mx-auto">
        <div className="h-7 bg-slate-100 rounded w-48 mx-auto mb-2" />
        <div className="h-2 bg-slate-100 rounded w-36 mx-auto mb-8" />
        <div className="w-52 h-52 bg-slate-100 rounded-full mx-auto mb-8" />
        <div className="space-y-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-slate-100 rounded-xl" />
          ))}
        </div>
        <div className="h-24 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-sm mx-auto">
      {/* Title with wavy underline */}
      <div className="text-center mb-7">
        <h2 className="text-2xl font-bold text-slate-900">Monthly Insights</h2>
        <svg
          viewBox="0 0 220 14"
          className="mx-auto mt-1.5 w-52"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M0 7 Q11 1 22 7 Q33 13 44 7 Q55 1 66 7 Q77 13 88 7 Q99 1 110 7 Q121 13 132 7 Q143 1 154 7 Q165 13 176 7 Q187 1 198 7 Q209 13 220 7"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
          {monthName} {year}
        </p>
      </div>

      {/* Donut Chart */}
      {donutData.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-slate-400 text-sm mb-7">
          No spending this month yet
        </div>
      ) : (
        <div className="relative w-52 h-52 mx-auto mb-7">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={
                      CATEGORY_CONFIG[entry.name as Category]?.color ?? "#6b7280"
                    }
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
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-sm shadow-xl">
                      <p className="text-slate-300 text-xs mb-0.5">
                        {config?.icon} {cat}
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(value, currency)}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl px-3 py-1.5 border border-slate-100 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Spending</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 categories */}
      <div className="mb-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Top 3
        </p>
        {top3.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No data yet
          </p>
        ) : (
          <div className="space-y-2">
            {top3.map((s) => {
              const config = CATEGORY_CONFIG[s.category];
              return (
                <div
                  key={s.category}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50"
                >
                  <div
                    className="w-1 h-7 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-base leading-none">{config.icon}</span>
                  <span className="flex-1 text-sm font-medium text-slate-700">
                    {s.category}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(s.total, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Streak */}
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-600 text-center mb-3">
          Budget Streak
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <p className="text-5xl font-bold text-emerald-500 leading-none tabular-nums">
              {streak}
            </p>
            <p className="text-sm font-medium text-slate-500 mt-1.5">days!</p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2.5 flex flex-col items-center gap-1">
              <span className="text-xl leading-none">
                {streak >= 7 ? "🔥" : streak >= 3 ? "⭐" : "💪"}
              </span>
              <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">
                {streak >= 7 ? "on fire!" : streak >= 3 ? "nice!" : "keep going!"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
