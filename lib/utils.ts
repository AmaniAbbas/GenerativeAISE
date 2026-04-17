import { Expense, MonthlySummary, CategorySummary, Category, Currency } from "./types";
import { MONTH_NAMES } from "./constants";

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: "en-US",
  GBP: "en-GB",
};

export function formatCurrency(amount: number, currency: Currency = "USD"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getCurrentMonthExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return expenses.filter((e) => {
    const [y, m] = e.date.split("-").map(Number);
    return y === year && m - 1 === month;
  });
}

export function getTotalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getMonthlySummaries(expenses: Expense[]): MonthlySummary[] {
  const map = new Map<string, number>();
  expenses.forEach((e) => {
    const [year, month] = e.date.split("-").map(Number);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + e.amount);
  });

  // Generate last 6 months
  const result: MonthlySummary[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    result.push({
      month: MONTH_NAMES[d.getMonth()],
      year,
      total: map.get(key) || 0,
    });
  }
  return result;
}

export function getCategorySummaries(expenses: Expense[]): CategorySummary[] {
  const map = new Map<Category, { total: number; count: number }>();
  const total = getTotalAmount(expenses);

  expenses.forEach((e) => {
    const existing = map.get(e.category) || { total: 0, count: 0 };
    map.set(e.category, {
      total: existing.total + e.amount,
      count: existing.count + 1,
    });
  });

  return Array.from(map.entries())
    .map(([category, { total: catTotal, count }]) => ({
      category,
      total: catTotal,
      count,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getTopCategory(expenses: Expense[]): Category | null {
  const summaries = getCategorySummaries(expenses);
  return summaries.length > 0 ? summaries[0].category : null;
}

export function filterExpenses(
  expenses: Expense[],
  filters: { search: string; category: string; dateFrom: string; dateTo: string }
): Expense[] {
  return expenses.filter((e) => {
    const matchesSearch =
      !filters.search ||
      e.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      e.category.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory =
      !filters.category || filters.category === "All" || e.category === filters.category;

    const matchesDateFrom = !filters.dateFrom || e.date >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || e.date <= filters.dateTo;

    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });
}
