"use client";

import { Header } from "@/components/layout/Header";
import { MonthlyInsights } from "@/components/monthly-insights/MonthlyInsights";
import { useExpenses } from "@/hooks/useExpenses";

export default function MonthlyInsightsPage() {
  const { expenses, isLoaded } = useExpenses();

  return (
    <>
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-bold">Monthly Insights</h2>
          <p className="text-indigo-100 text-sm mt-0.5">
            A snapshot of your spending this month.
          </p>
        </div>

        <MonthlyInsights expenses={expenses} isLoaded={isLoaded} />
      </main>
    </>
  );
}
