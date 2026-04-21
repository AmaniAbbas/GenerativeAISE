"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Expense, Currency } from "@/lib/types";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";

interface DailySpendingChartProps {
  expenses: Expense[];
  isLoaded: boolean;
}

function getDailyData(expenses: Expense[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const map = new Map<number, number>();
  expenses.forEach((e) => {
    const [y, m, d] = e.date.split("-").map(Number);
    if (y === year && m - 1 === month) {
      map.set(d, (map.get(d) || 0) + e.amount);
    }
  });

  return Array.from({ length: today }, (_, i) => ({
    day: i + 1,
    total: map.get(i + 1) || 0,
  }));
}

function currencySymbol(currency: Currency) {
  return currency === "USD" ? "$" : "£";
}

export function DailySpendingChart({ expenses, isLoaded }: DailySpendingChartProps) {
  const { currency } = useCurrency();
  const data = getDailyData(expenses);
  const hasData = data.some((d) => d.total > 0);
  const maxVal = hasData ? Math.max(...data.map((d) => d.total)) : 0;

  const symbol = currencySymbol(currency);

  const tickFormatter = (value: number) => {
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${value.toFixed(0)}`;
  };

  const monthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-44 mb-1" />
        <div className="h-3 bg-slate-100 rounded w-28 mb-6" />
        <div className="h-44 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">Daily Spending</h3>
        <p className="text-xs text-slate-400 mt-0.5">{monthName}</p>
      </div>

      {!hasData ? (
        <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
          No spending this month
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={176}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              dy={8}
              interval={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={tickFormatter}
              width={50}
            />
            <Tooltip
              cursor={{ fill: "#f8fafc", radius: 4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0]?.value;
                if (typeof value !== "number") return null;
                return (
                  <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl text-sm shadow-xl">
                    <p className="text-slate-400 text-xs font-medium mb-0.5">
                      {new Date().toLocaleDateString("en-US", { month: "short" })} {label}
                    </p>
                    <p className="font-semibold text-indigo-300">
                      {formatCurrency(value, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={
                    entry.total === maxVal && entry.total > 0
                      ? "#4f46e5"
                      : entry.total > 0
                      ? "#a5b4fc"
                      : "#e2e8f0"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
