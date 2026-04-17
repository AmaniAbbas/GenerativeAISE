"use client";

import { Expense } from "@/lib/types";
import {
  formatCurrency,
  getTotalAmount,
  getCurrentMonthExpenses,
  getTopCategory,
} from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  expenses: Expense[];
  isLoaded: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
        <div className="w-16 h-5 bg-slate-100 rounded" />
      </div>
      <div className="h-7 w-28 bg-slate-100 rounded mb-1" />
      <div className="h-4 w-20 bg-slate-100 rounded" />
    </div>
  );
}

export function SummaryCards({ expenses, isLoaded }: Props) {
  const { currency } = useCurrency();
  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const monthlyExpenses = getCurrentMonthExpenses(expenses);
  const monthlyTotal = getTotalAmount(monthlyExpenses);
  const allTimeTotal = getTotalAmount(expenses);
  const topCat = getTopCategory(expenses);

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthExpenses = expenses.filter((e) => {
    const [y, m] = e.date.split("-").map(Number);
    return y === prevMonth.getFullYear() && m - 1 === prevMonth.getMonth();
  });
  const prevMonthTotal = getTotalAmount(prevMonthExpenses);
  const monthChange =
    prevMonthTotal > 0
      ? ((monthlyTotal - prevMonthTotal) / prevMonthTotal) * 100
      : null;

  const avgMonthly = allTimeTotal > 0 ? allTimeTotal / Math.max(1, getMonthCount(expenses)) : 0;

  const cards = [
    {
      label: "This Month",
      value: formatCurrency(monthlyTotal, currency),
      subtext:
        monthChange !== null
          ? `${monthChange >= 0 ? "+" : ""}${monthChange.toFixed(0)}% vs last month`
          : `${monthlyExpenses.length} transaction${monthlyExpenses.length !== 1 ? "s" : ""}`,
      subtextColor: monthChange !== null && monthChange > 10 ? "text-red-500" : monthChange !== null && monthChange < -5 ? "text-emerald-500" : "text-slate-400",
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: "bg-indigo-50",
      gradient: "from-indigo-50",
    },
    {
      label: "All Time Total",
      value: formatCurrency(allTimeTotal, currency),
      subtext: `${expenses.length} total expense${expenses.length !== 1 ? "s" : ""}`,
      subtextColor: "text-slate-400",
      icon: (
        <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-violet-50",
      gradient: "from-violet-50",
    },
    {
      label: "Avg / Month",
      value: formatCurrency(avgMonthly, currency),
      subtext: "based on history",
      subtextColor: "text-slate-400",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      iconBg: "bg-blue-50",
      gradient: "from-blue-50",
    },
    {
      label: "Top Category",
      value: topCat ? `${CATEGORY_CONFIG[topCat].icon} ${topCat}` : "—",
      subtext: topCat
        ? formatCurrency(expenses.filter((e) => e.category === topCat).reduce((s, e) => s + e.amount, 0), currency)
        : "No expenses yet",
      subtextColor: "text-slate-400",
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      iconBg: "bg-amber-50",
      gradient: "from-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow bg-gradient-to-br ${card.gradient} to-white`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
              {card.icon}
            </div>
            <span className="text-xs text-slate-400 font-medium">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 leading-none mb-1.5">{card.value}</p>
          <p className={`text-xs font-medium ${card.subtextColor}`}>{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}

function getMonthCount(expenses: Expense[]): number {
  const months = new Set(expenses.map((e) => e.date.slice(0, 7)));
  return months.size || 1;
}
