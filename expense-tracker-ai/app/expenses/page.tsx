"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ExpenseFiltersBar } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseFilters, ExpenseFormData } from "@/lib/types";
import { filterExpenses, formatCurrency, getTotalAmount } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import { useCurrency } from "@/context/CurrencyContext";

const defaultFilters: ExpenseFilters = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

export default function ExpensesPage() {
  const { expenses, isLoaded, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { currency } = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilters>(defaultFilters);

  const filtered = useMemo(
    () => filterExpenses(expenses, filters),
    [expenses, filters]
  );

  const handleAdd = (data: ExpenseFormData) => {
    addExpense(data);
    setShowForm(false);
  };

  const handleExport = () => {
    exportToCSV(filtered.length > 0 ? filtered : expenses);
  };

  const filteredTotal = getTotalAmount(filtered);

  return (
    <>
      <Header onAddExpense={() => setShowForm(true)} />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 md:hidden">Expenses</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isLoaded ? (
                <>
                  {filtered.length} expense{filtered.length !== 1 ? "s" : ""} &middot;{" "}
                  <span className="font-semibold text-slate-700">{formatCurrency(filteredTotal, currency)}</span>
                </>
              ) : (
                "Loading…"
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="md:hidden flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {/* Filters */}
        <ExpenseFiltersBar
          filters={filters}
          onChange={setFilters}
          onExport={handleExport}
          totalShown={filtered.length}
          totalAll={expenses.length}
        />

        {/* List */}
        <ExpenseList
          expenses={filtered}
          onUpdate={updateExpense}
          onDelete={deleteExpense}
          isLoaded={isLoaded}
        />
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
