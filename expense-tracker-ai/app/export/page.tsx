"use client";

import { CloudExportHub } from "@/components/export/CloudExportHub";
import { useExpenses } from "@/hooks/useExpenses";

export default function ExportPage() {
  const { expenses, isLoaded } = useExpenses();

  if (!isLoaded) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <CloudExportHub expenses={expenses} />
    </main>
  );
}
