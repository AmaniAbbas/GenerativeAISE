"use client";

import { Expense } from "@/lib/types";
import { useCurrency } from "@/context/CurrencyContext";
import {
  formatCurrency,
  getCurrentMonthExpenses,
  getTotalAmount,
  getCategorySummaries,
} from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";

interface InsightCardsProps {
  expenses: Expense[];
  isLoaded: boolean;
}

export function InsightCards({ expenses, isLoaded }: InsightCardsProps) {
  const { currency } = useCurrency();

  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
            <div className="h-7 bg-slate-100 rounded w-32 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const currentMonthTotal = getTotalAmount(currentMonthExpenses);
  const dayOfMonth = new Date().getDate();
  const avgDailySpend = dayOfMonth > 0 ? currentMonthTotal / dayOfMonth : 0;

  const biggestExpense =
    expenses.length > 0
      ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0])
      : null;

  const categorySummaries = getCategorySummaries(expenses);
  const topCategory = categorySummaries[0] ?? null;

  const avgTransaction =
    expenses.length > 0 ? getTotalAmount(expenses) / expenses.length : 0;

  const cards = [
    {
      label: "Avg Daily Spend",
      sublabel: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      value: formatCurrency(avgDailySpend, currency),
      icon: "📅",
      gradient: "from-indigo-50 to-white",
      iconBg: "bg-indigo-100",
    },
    {
      label: "Largest Expense",
      sublabel: biggestExpense?.description ?? "No expenses yet",
      value: biggestExpense ? formatCurrency(biggestExpense.amount, currency) : "—",
      icon: "🔝",
      gradient: "from-violet-50 to-white",
      iconBg: "bg-violet-100",
    },
    {
      label: "Top Category",
      sublabel: topCategory
        ? `${topCategory.percentage.toFixed(0)}% of all spending`
        : "No data yet",
      value: topCategory?.category ?? "—",
      icon: topCategory ? CATEGORY_CONFIG[topCategory.category].icon : "📊",
      gradient: "from-amber-50 to-white",
      iconBg: "bg-amber-100",
    },
    {
      label: "Avg Transaction",
      sublabel: `across ${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`,
      value: formatCurrency(avgTransaction, currency),
      icon: "💳",
      gradient: "from-emerald-50 to-white",
      iconBg: "bg-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`bg-gradient-to-br ${card.gradient} rounded-2xl border border-slate-100 shadow-sm p-5`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{card.sublabel}</p>
            </div>
            <div
              className={`${card.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
