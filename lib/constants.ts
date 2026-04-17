import { Category } from "./types";

export const CATEGORIES: Category[] = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Healthcare",
  "Other",
];

export const CATEGORY_CONFIG: Record<
  Category,
  { color: string; bgColor: string; icon: string; tailwindColor: string }
> = {
  Food: {
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "🍔",
    tailwindColor: "text-amber-500",
  },
  Transportation: {
    color: "#3b82f6",
    bgColor: "#dbeafe",
    icon: "🚗",
    tailwindColor: "text-blue-500",
  },
  Entertainment: {
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    icon: "🎬",
    tailwindColor: "text-violet-500",
  },
  Shopping: {
    color: "#ec4899",
    bgColor: "#fce7f3",
    icon: "🛍️",
    tailwindColor: "text-pink-500",
  },
  Bills: {
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "📄",
    tailwindColor: "text-red-500",
  },
  Healthcare: {
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "🏥",
    tailwindColor: "text-emerald-500",
  },
  Other: {
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "📦",
    tailwindColor: "text-gray-500",
  },
};

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
