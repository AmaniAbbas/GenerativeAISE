"use client";

import { useState, useEffect } from "react";
import { Expense, ExpenseFormData, Category } from "@/lib/types";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { getTodayISO } from "@/lib/utils";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  initialData?: Expense;
  isSubmitting?: boolean;
}

const emptyForm: ExpenseFormData = {
  amount: "",
  category: "Food",
  description: "",
  date: getTodayISO(),
};

export function ExpenseForm({ onSubmit, onCancel, initialData, isSubmitting }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        amount: initialData.amount.toString(),
        category: initialData.category,
        description: initialData.description,
        date: initialData.date,
      });
    } else {
      setForm({ ...emptyForm, date: getTodayISO() });
    }
    setErrors({});
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    } else if (amount > 1_000_000) {
      newErrors.amount = "Amount cannot exceed $1,000,000";
    }
    if (!form.description.trim()) {
      newErrors.description = "Please enter a description";
    } else if (form.description.trim().length > 100) {
      newErrors.description = "Description must be 100 characters or less";
    }
    if (!form.date) {
      newErrors.date = "Please select a date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const field = (key: keyof ExpenseFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="1000000"
            value={form.amount}
            onChange={(e) => field("amount", e.target.value)}
            placeholder="0.00"
            className={`w-full pl-7 pr-3 py-2.5 rounded-xl border text-slate-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
              errors.amount ? "border-red-300 focus:ring-red-400" : "border-slate-200"
            }`}
          />
        </div>
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const selected = form.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => field("category", cat)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                  selected
                    ? "border-transparent shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                style={selected ? { backgroundColor: config.bgColor, borderColor: config.color } : {}}
              >
                <span>{config.icon}</span>
                <span
                  className="font-medium"
                  style={selected ? { color: config.color } : { color: "#475569" }}
                >
                  {cat}
                </span>
                {selected && (
                  <svg className="w-3.5 h-3.5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: config.color }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => field("description", e.target.value)}
          placeholder="What did you spend on?"
          maxLength={100}
          className={`w-full px-3 py-2.5 rounded-xl border text-slate-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
            errors.description ? "border-red-300 focus:ring-red-400" : "border-slate-200"
          }`}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description ? (
            <p className="text-red-500 text-xs">{errors.description}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-slate-400">{form.description.length}/100</p>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={form.date}
          max={getTodayISO()}
          onChange={(e) => field("date", e.target.value)}
          className={`w-full px-3 py-2.5 rounded-xl border text-slate-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
            errors.date ? "border-red-300 focus:ring-red-400" : "border-slate-200"
          }`}
        />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? "Saving…" : initialData ? "Save Changes" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}
