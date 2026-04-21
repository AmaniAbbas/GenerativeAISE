"use client";

import { Header } from "@/components/layout/Header";
import { InsightCards } from "@/components/analytics/InsightCards";
import { SpendingTrendChart } from "@/components/analytics/SpendingTrendChart";
import { CategoryDonutChart } from "@/components/analytics/CategoryDonutChart";
import { DailySpendingChart } from "@/components/analytics/DailySpendingChart";
import { useExpenses } from "@/hooks/useExpenses";

export default function AnalyticsPage() {
  const { expenses, isLoaded } = useExpenses();

  return (
    <>
      <Header />

      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
          <div>
            <h2 className="text-lg font-bold">Analytics</h2>
            <p className="text-indigo-100 text-sm mt-0.5">
              Deep-dive into your spending patterns and trends.
            </p>
          </div>
        </div>

        {/* KPI insight cards */}
        <InsightCards expenses={expenses} isLoaded={isLoaded} />

        {/* 12-month area chart */}
        <SpendingTrendChart expenses={expenses} isLoaded={isLoaded} />

        {/* Category donut + daily spending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CategoryDonutChart expenses={expenses} isLoaded={isLoaded} />
          <DailySpendingChart expenses={expenses} isLoaded={isLoaded} />
        </div>
      </main>
    </>
  );
}
