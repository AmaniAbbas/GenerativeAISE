import { Category } from "@/lib/types";
import { CATEGORY_CONFIG } from "@/lib/constants";

interface BadgeProps {
  category: Category;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "md" }: BadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span>{config.icon}</span>
      {category}
    </span>
  );
}
