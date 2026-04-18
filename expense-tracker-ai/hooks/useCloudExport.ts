"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/lib/types";
import {
  CloudIntegration, ExportRecord, ScheduledExport, ShareLink,
  CloudService, ExportTemplate, ExportFormat, ExportDestination,
} from "@/lib/cloudExportTypes";
import { generateId } from "@/lib/utils";

const SK_INT = "ss-cloud-integrations";
const SK_HIST = "ss-cloud-history";
const SK_SCHED = "ss-cloud-schedules";
const SK_SHARE = "ss-cloud-sharelinks";

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}
function fromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}
const DAY = 86400000;

function seedIntegrations(): CloudIntegration[] {
  return [
    { id: "google-sheets", connected: true, accountEmail: "me@gmail.com", lastSync: ago(2 * 3600000), syncStatus: "success", autoSync: true },
    { id: "google-drive", connected: true, accountEmail: "me@gmail.com", lastSync: ago(26 * 3600000), syncStatus: "success", autoSync: false },
    { id: "dropbox", connected: false, syncStatus: "idle", autoSync: false },
    { id: "onedrive", connected: false, syncStatus: "idle", autoSync: false },
    { id: "notion", connected: false, syncStatus: "idle", autoSync: false },
    { id: "email", connected: true, accountEmail: "me@gmail.com", lastSync: ago(3 * DAY), syncStatus: "success", autoSync: false },
  ];
}

function seedHistory(): ExportRecord[] {
  return [
    { id: generateId(), createdAt: ago(21 * DAY), template: "full-export", format: "csv", destination: "download", status: "success", expenseCount: 45, sizeBytes: 3241, filename: "full-export-2026-03-28.csv" },
    { id: generateId(), createdAt: ago(14 * DAY), template: "monthly-summary", format: "excel", destination: "google-sheets", status: "success", expenseCount: 18, sizeBytes: 8920, filename: "monthly-summary-2026-04-04.xlsx" },
    { id: generateId(), createdAt: ago(10 * DAY), template: "tax-report", format: "pdf", destination: "email", status: "success", expenseCount: 45, sizeBytes: 15400, filename: "tax-report-2026-04-08.pdf" },
    { id: generateId(), createdAt: ago(7 * DAY), template: "category-analysis", format: "csv", destination: "download", status: "success", expenseCount: 45, sizeBytes: 2100, filename: "category-analysis-2026-04-11.csv" },
    { id: generateId(), createdAt: ago(5 * DAY), template: "year-in-review", format: "json", destination: "google-drive", status: "success", expenseCount: 45, sizeBytes: 11200, filename: "year-in-review-2026-04-13.json" },
    { id: generateId(), createdAt: ago(2 * DAY), template: "monthly-summary", format: "csv", destination: "download", status: "success", expenseCount: 20, sizeBytes: 1800, filename: "monthly-summary-2026-04-16.csv" },
    { id: generateId(), createdAt: ago(1 * DAY), template: "budget-overview", format: "excel", destination: "dropbox", status: "failed", expenseCount: 20, filename: "budget-overview-2026-04-17.xlsx" },
  ];
}

function seedSchedules(): ScheduledExport[] {
  return [
    {
      id: generateId(), label: "Weekly CSV Backup",
      enabled: true, frequency: "weekly", dayOfWeek: 1, hour: 9,
      format: "csv", template: "full-export", destination: "email",
      createdAt: ago(30 * DAY), nextRun: fromNow(2 * DAY), lastRun: ago(5 * DAY), lastStatus: "success",
    },
    {
      id: generateId(), label: "Monthly Tax Report",
      enabled: true, frequency: "monthly", dayOfMonth: 1, hour: 8,
      format: "pdf", template: "tax-report", destination: "google-drive",
      createdAt: ago(60 * DAY), nextRun: fromNow(13 * DAY), lastRun: ago(18 * DAY), lastStatus: "success",
    },
  ];
}

function seedShareLinks(): ShareLink[] {
  return [
    { id: generateId(), code: "x7kp2mnr", createdAt: ago(4 * DAY), expiresAt: fromNow(3 * DAY), template: "monthly-summary", permission: "view", accessCount: 5, active: true },
    { id: generateId(), code: "q9wz4tsl", createdAt: ago(10 * DAY), expiresAt: ago(3 * DAY), template: "category-analysis", permission: "download", accessCount: 12, active: false },
  ];
}

function loadOrSeed<T>(key: string, seed: () => T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  const data = seed();
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
  return data;
}

function save<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

function buildContent(
  expenses: Expense[],
  template: ExportTemplate,
  format: ExportFormat
): { content: string; mimeType: string; ext: string } {
  let data = expenses;
  if (template === "year-in-review") {
    const y = new Date().getFullYear().toString();
    data = expenses.filter((e) => e.date.startsWith(y));
  } else if (template === "monthly-summary") {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    data = expenses.filter((e) => e.date.startsWith(prefix));
  }
  switch (format) {
    case "csv": {
      const rows = data.map(
        (e) => `${e.date},"${e.category}","${e.description.replace(/"/g, '""')}",${e.amount.toFixed(2)}`
      );
      return { content: "Date,Category,Description,Amount\n" + rows.join("\n"), mimeType: "text/csv", ext: "csv" };
    }
    case "json":
      return { content: JSON.stringify(data, null, 2), mimeType: "application/json", ext: "json" };
    case "excel": {
      const rows = data.map((e) => `${e.date}\t${e.category}\t${e.description}\t${e.amount.toFixed(2)}`);
      return { content: "Date\tCategory\tDescription\tAmount\n" + rows.join("\n"), mimeType: "text/tab-separated-values", ext: "xlsx" };
    }
    default:
      return { content: "", mimeType: "application/pdf", ext: "pdf" };
  }
}

export function useCloudExport() {
  const [integrations, setIntegrations] = useState<CloudIntegration[]>([]);
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduledExport[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [connecting, setConnecting] = useState<CloudService | null>(null);
  const [syncing, setSyncing] = useState<CloudService | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setIntegrations(loadOrSeed(SK_INT, seedIntegrations));
    setHistory(loadOrSeed(SK_HIST, seedHistory));
    setSchedules(loadOrSeed(SK_SCHED, seedSchedules));
    setShareLinks(loadOrSeed(SK_SHARE, seedShareLinks));
    setIsLoaded(true);
  }, []);

  const connectIntegration = useCallback((service: CloudService, email: string) => {
    setConnecting(service);
    setTimeout(() => {
      setIntegrations((prev) => {
        const next = prev.map((i) =>
          i.id === service
            ? { ...i, connected: true, accountEmail: email, lastSync: new Date().toISOString(), syncStatus: "success" as const }
            : i
        );
        save(SK_INT, next);
        return next;
      });
      setConnecting(null);
    }, 1800);
  }, []);

  const disconnectIntegration = useCallback((service: CloudService) => {
    setIntegrations((prev) => {
      const next = prev.map((i) =>
        i.id === service
          ? { ...i, connected: false, accountEmail: undefined, lastSync: undefined, syncStatus: "idle" as const, autoSync: false }
          : i
      );
      save(SK_INT, next);
      return next;
    });
  }, []);

  const syncNow = useCallback((service: CloudService) => {
    setIntegrations((prev) => {
      const next = prev.map((i) => (i.id === service ? { ...i, syncStatus: "syncing" as const } : i));
      save(SK_INT, next);
      return next;
    });
    setSyncing(service);
    setTimeout(() => {
      setIntegrations((prev) => {
        const next = prev.map((i) =>
          i.id === service ? { ...i, syncStatus: "success" as const, lastSync: new Date().toISOString() } : i
        );
        save(SK_INT, next);
        return next;
      });
      setSyncing(null);
    }, 2200);
  }, []);

  const toggleAutoSync = useCallback((service: CloudService) => {
    setIntegrations((prev) => {
      const next = prev.map((i) => (i.id === service ? { ...i, autoSync: !i.autoSync } : i));
      save(SK_INT, next);
      return next;
    });
  }, []);

  const exportTemplate = useCallback(
    async (template: ExportTemplate, format: ExportFormat, destination: ExportDestination, expenses: Expense[]) => {
      setExporting(true);
      await new Promise((r) => setTimeout(r, 1300));

      if (destination === "download" && format !== "pdf") {
        const { content, mimeType, ext } = buildContent(expenses, template, format);
        const filename = `${template}-${new Date().toISOString().split("T")[0]}.${ext}`;
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const record: ExportRecord = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        template,
        format,
        destination,
        status: "success",
        expenseCount: expenses.length,
        sizeBytes: Math.floor(expenses.length * 90 + Math.random() * 600),
        filename: `${template}-${new Date().toISOString().split("T")[0]}.${format}`,
      };

      setHistory((prev) => {
        const next = [record, ...prev];
        save(SK_HIST, next);
        return next;
      });

      setExporting(false);
      return "success" as const;
    },
    []
  );

  const createSchedule = useCallback((data: Omit<ScheduledExport, "id" | "createdAt" | "nextRun">) => {
    const schedule: ScheduledExport = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      nextRun: fromNow(
        data.frequency === "daily" ? DAY : data.frequency === "weekly" ? 7 * DAY : 30 * DAY
      ),
    };
    setSchedules((prev) => {
      const next = [...prev, schedule];
      save(SK_SCHED, next);
      return next;
    });
  }, []);

  const toggleSchedule = useCallback((id: string) => {
    setSchedules((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      save(SK_SCHED, next);
      return next;
    });
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules((prev) => {
      const next = prev.filter((s) => s.id !== id);
      save(SK_SCHED, next);
      return next;
    });
  }, []);

  const generateShareLink = useCallback(
    (template: ExportTemplate, permission: "view" | "download", expiryDays: number): ShareLink => {
      const code = Math.random().toString(36).slice(2, 10);
      const link: ShareLink = {
        id: generateId(),
        code,
        createdAt: new Date().toISOString(),
        expiresAt: fromNow(expiryDays * DAY),
        template,
        permission,
        accessCount: 0,
        active: true,
      };
      setShareLinks((prev) => {
        const next = [link, ...prev];
        save(SK_SHARE, next);
        return next;
      });
      return link;
    },
    []
  );

  const revokeShareLink = useCallback((id: string) => {
    setShareLinks((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, active: false } : l));
      save(SK_SHARE, next);
      return next;
    });
  }, []);

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      save(SK_HIST, next);
      return next;
    });
  }, []);

  return {
    integrations, history, schedules, shareLinks, isLoaded,
    connecting, syncing, exporting,
    connectIntegration, disconnectIntegration, syncNow, toggleAutoSync,
    exportTemplate, createSchedule, toggleSchedule, deleteSchedule,
    generateShareLink, revokeShareLink, deleteHistoryEntry,
  };
}
