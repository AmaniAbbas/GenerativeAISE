"use client";

import Link from "next/link";
import { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { CategoryBadge } from "@/components/ui/Badge";
import { useCurrency } from "@/context/CurrencyContext";

interface Props {
  expenses: Expense[];
  isLoaded: boolean;
}

export function RecentExpenses({ expenses, isLoaded }: Props) {
  const { currency } = useCurrency();
  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-900">Recent Expenses</h3>
        <Link
          href="/expenses"
          className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          View all →
        </Link>
      </div>

      {!isLoaded ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="h-4 w-14 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">No expenses yet.</p>
          <p className="text-slate-300 text-xs mt-1">Add your first expense to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category];
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: config.bgColor }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{expense.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(expense.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold" style={{ color: config.color }}>
                    {formatCurrency(expense.amount, currency)}
                  </span>
                  <CategoryBadge category={expense.category} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
