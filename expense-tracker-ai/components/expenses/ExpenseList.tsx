"use client";

import { useState } from "react";
import { Expense, ExpenseFormData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useCurrency } from "@/context/CurrencyContext";
import { CategoryBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "./ExpenseForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Props {
  expenses: Expense[];
  onUpdate: (id: string, data: ExpenseFormData) => void;
  onDelete: (id: string) => void;
  isLoaded: boolean;
}

export function ExpenseList({ expenses, onUpdate, onDelete, isLoaded }: Props) {
  const { currency } = useCurrency();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
              <div className="h-5 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-slate-700 font-semibold mb-1">No expenses found</p>
        <p className="text-slate-400 text-sm">Try adjusting your filters or add a new expense.</p>
      </div>
    );
  }

  // Group by date
  const groups = expenses.reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="space-y-4">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">
                {formatCurrency(groups[date].reduce((s, e) => s + e.amount, 0), currency)}
              </span>
            </div>

            <div className="space-y-2">
              {groups[date].map((expense) => {
                const config = CATEGORY_CONFIG[expense.category];
                return (
                  <div
                    key={expense.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        {config.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {expense.description}
                          </p>
                          <p
                            className="text-base font-bold flex-shrink-0"
                            style={{ color: config.color }}
                          >
                            {formatCurrency(expense.amount, currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <CategoryBadge category={expense.category} size="sm" />
                        </div>
                      </div>

                      {/* Actions — visible on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingId(expense.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            onSubmit={(data) => {
              onUpdate(editingExpense.id, data);
              setEditingExpense(null);
            }}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && onDelete(deletingId)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
