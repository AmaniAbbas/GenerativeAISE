"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense, ExpenseFormData } from "@/lib/types";
import { generateId, getTodayISO } from "@/lib/utils";

const STORAGE_KEY = "expense-tracker-expenses";

function seedDemoData(): Expense[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const ago = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return fmt(d);
  };

  return [
    { id: generateId(), amount: 12.50, category: "Food", description: "Coffee and bagel", date: ago(0), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 45.00, category: "Transportation", description: "Uber rides", date: ago(1), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 89.99, category: "Shopping", description: "Amazon order", date: ago(2), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 15.00, category: "Entertainment", description: "Netflix subscription", date: ago(3), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 120.00, category: "Bills", description: "Electric bill", date: ago(5), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 32.75, category: "Food", description: "Grocery store", date: ago(5), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 25.00, category: "Healthcare", description: "Pharmacy", date: ago(7), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 8.99, category: "Entertainment", description: "Spotify", date: ago(8), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 55.00, category: "Food", description: "Restaurant dinner", date: ago(10), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 200.00, category: "Bills", description: "Internet + phone", date: ago(12), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 67.50, category: "Shopping", description: "Clothing", date: ago(14), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 18.00, category: "Transportation", description: "Gas station", date: ago(15), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 300.00, category: "Bills", description: "Rent contribution", date: ago(20), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 22.50, category: "Food", description: "Lunch with coworkers", date: ago(21), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 14.99, category: "Entertainment", description: "Movie ticket", date: ago(22), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 95.00, category: "Healthcare", description: "Doctor copay", date: ago(25), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 42.00, category: "Food", description: "Weekly groceries", date: ago(28), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 11.50, category: "Transportation", description: "Metro card", date: ago(30), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 150.00, category: "Shopping", description: "Electronics", date: ago(35), createdAt: new Date().toISOString() },
    { id: generateId(), amount: 29.99, category: "Food", description: "Takeout", date: ago(38), createdAt: new Date().toISOString() },
  ];
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      } else {
        const demo = seedDemoData();
        setExpenses(demo);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      }
    } catch {
      setExpenses([]);
    }
    setIsLoaded(true);
  }, []);

  const persist = useCallback((updated: Expense[]) => {
    setExpenses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addExpense = useCallback(
    (data: ExpenseFormData) => {
      const expense: Expense = {
        id: generateId(),
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description.trim(),
        date: data.date || getTodayISO(),
        createdAt: new Date().toISOString(),
      };
      persist([expense, ...expenses]);
      return expense;
    },
    [expenses, persist]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData) => {
      const updated = expenses.map((e) =>
        e.id === id
          ? {
              ...e,
              amount: parseFloat(data.amount),
              category: data.category,
              description: data.description.trim(),
              date: data.date || getTodayISO(),
            }
          : e
      );
      persist(updated);
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAll,
  };
}
