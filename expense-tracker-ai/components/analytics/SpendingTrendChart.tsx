"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Expense, Currency } from "@/lib/types";
import { useCurrency } from "@/context/CurrencyContext";
import { formatCurrency } from "@/lib/utils";
import { MONTH_NAMES } from "@/lib/constants";

interface SpendingTrendChartProps {
  expenses: Expense[];
  isLoaded: boolean;
}

function get12MonthData(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((e) => {
    const [year, month] = e.date.split("-").map(Number);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + e.amount);
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel =
      d.getFullYear() !== currentYear
        ? `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
        : MONTH_NAMES[d.getMonth()];
    return { month: monthLabel, total: map.get(key) || 0 };
  });
}

function currencySymbol(currency: Currency) {
  return currency === "USD" ? "$" : "£";
}

export function SpendingTrendChart({ expenses, isLoaded }: SpendingTrendChartProps) {
  const { currency } = useCurrency();
  const data = get12MonthData(expenses);
  const hasData = data.some((d) => d.total > 0);

  const symbol = currencySymbol(currency);

  const tickFormatter = (value: number) => {
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${value.toFixed(0)}`;
  };

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-36 mb-1" />
        <div className="h-3 bg-slate-100 rounded w-24 mb-6" />
        <div className="h-52 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">Spending Trend</h3>
        <p className="text-xs text-slate-400 mt-0.5">Last 12 months</p>
      </div>

      {!hasData ? (
        <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
          No spending data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={tickFormatter}
              width={55}
            />
            <Tooltip
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = payload[0]?.value;
                if (typeof value !== "number") return null;
                return (
                  <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl text-sm shadow-xl">
                    <p className="text-slate-400 text-xs font-medium mb-0.5">{label}</p>
                    <p className="font-semibold text-indigo-300">
                      {formatCurrency(value, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fill="url(#trendGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
