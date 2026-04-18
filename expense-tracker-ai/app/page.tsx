"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseFormData } from "@/lib/types";
import { exportToCSV } from "@/lib/export";

export default function DashboardPage() {
  const { expenses, isLoaded, addExpense } = useExpenses();
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (data: ExpenseFormData) => {
    addExpense(data);
    setShowForm(false);
  };

  return (
    <>
      <Header onAddExpense={() => setShowForm(true)} />

      <main className="flex-1 p-4 md:p-6 space-y-5">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold">Good day! 👋</h2>
              <p className="text-indigo-100 text-sm mt-0.5">
                Here&#39;s your spending overview for{" "}
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportToCSV(expenses)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <SummaryCards expenses={expenses} isLoaded={isLoaded} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SpendingChart expenses={expenses} isLoaded={isLoaded} />
          <CategoryBreakdown expenses={expenses} isLoaded={isLoaded} />
        </div>

        {/* Recent expenses */}
        <RecentExpenses expenses={expenses} isLoaded={isLoaded} />
      </main>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Expense">
        <ExpenseForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </>
  );
}
