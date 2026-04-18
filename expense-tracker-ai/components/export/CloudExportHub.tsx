"use client";

import { useState, useCallback } from "react";
import { useCloudExport } from "@/hooks/useCloudExport";
import { Expense } from "@/lib/types";
import {
  CloudService, ExportTemplate, ExportFormat, ExportDestination,
  CloudIntegration, ExportRecord, ScheduledExport, ShareLink,
} from "@/lib/cloudExportTypes";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = ["Templates", "Integrations", "Schedule", "History", "Share"] as const;
type Tab = (typeof TABS)[number];

const TEMPLATE_CONFIG: Record<
  ExportTemplate,
  { label: string; description: string; icon: string; accentBorder: string; formats: ExportFormat[]; badge?: string }
> = {
  "full-export": {
    label: "Full Export", icon: "📦", accentBorder: "border-slate-200",
    description: "Every expense, every field. The ultimate personal backup with complete audit trail.",
    formats: ["csv", "json", "excel", "pdf"],
  },
  "tax-report": {
    label: "Tax Report", icon: "🧾", accentBorder: "border-emerald-200",
    description: "Deduction-ready report sorted by category with IRS-friendly groupings and totals.",
    formats: ["csv", "excel", "pdf"], badge: "Popular",
  },
  "monthly-summary": {
    label: "Monthly Summary", icon: "📅", accentBorder: "border-blue-200",
    description: "Month-over-month breakdown with trend analysis and comparison to previous periods.",
    formats: ["csv", "excel", "pdf"],
  },
  "category-analysis": {
    label: "Category Analysis", icon: "🎯", accentBorder: "border-violet-200",
    description: "Deep-dive into each spending category with percentages, rankings, and patterns.",
    formats: ["csv", "json", "excel"],
  },
  "year-in-review": {
    label: "Year in Review", icon: "✨", accentBorder: "border-amber-200",
    description: "Annual highlights reel: biggest spends, best months, category champions, and YoY shifts.",
    formats: ["csv", "excel", "pdf"], badge: "New",
  },
  "budget-overview": {
    label: "Budget Overview", icon: "💰", accentBorder: "border-rose-200",
    description: "Spending vs. budget targets per category — the report your accountant will love.",
    formats: ["csv", "excel", "pdf"],
  },
};

const SERVICE_CONFIG: Record<
  CloudService,
  { label: string; shortLabel: string; description: string; bg: string; ring: string }
> = {
  "google-sheets": { label: "Google Sheets", shortLabel: "Sheets", description: "Sync to a live spreadsheet for real-time analysis.", bg: "bg-emerald-500", ring: "ring-emerald-200" },
  "google-drive": { label: "Google Drive", shortLabel: "Drive", description: "Auto-backup export files to your Drive folder.", bg: "bg-blue-500", ring: "ring-blue-200" },
  "dropbox": { label: "Dropbox", shortLabel: "Dropbox", description: "Keep exports versioned in your Dropbox.", bg: "bg-indigo-600", ring: "ring-indigo-200" },
  "onedrive": { label: "OneDrive", shortLabel: "OneDrive", description: "Backup files to Microsoft OneDrive.", bg: "bg-sky-500", ring: "ring-sky-200" },
  "notion": { label: "Notion", shortLabel: "Notion", description: "Push expense data to a Notion database page.", bg: "bg-slate-900", ring: "ring-slate-300" },
  "email": { label: "Email", shortLabel: "Email", description: "Email reports directly to any address.", bg: "bg-rose-500", ring: "ring-rose-200" },
};

const FORMAT_LABELS: Record<ExportFormat, string> = { csv: "CSV", json: "JSON", excel: "Excel", pdf: "PDF" };
const FREQ_LABELS: Record<"daily" | "weekly" | "monthly", string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `in ${d}d ${h}h`;
  return `in ${h}h`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Generates a deterministic QR-like pattern from a short code string
function codeToQRGrid(code: string): boolean[][] {
  const SIZE = 21;
  const grid: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false) as boolean[]);

  const finder = (r: number, c: number) => {
    for (let i = r; i < r + 7; i++)
      for (let j = c; j < c + 7; j++)
        grid[i][j] = i === r || i === r + 6 || j === c || j === c + 6 || (i >= r + 2 && i <= r + 4 && j >= c + 2 && j <= c + 4);
  };
  finder(0, 0); finder(0, 14); finder(14, 0);

  let charIdx = 0; let bitIdx = 0;
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const inFinder =
        (i < 8 && j < 8) || (i < 8 && j > 12) || (i > 12 && j < 8);
      if (inFinder) continue;
      const charCode = code.charCodeAt(charIdx % code.length);
      grid[i][j] = Boolean((charCode >> (bitIdx % 8)) & 1);
      bitIdx++;
      if (bitIdx % 8 === 0) charIdx++;
    }
  }
  return grid;
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function ServiceLogo({ service, size = "md" }: { service: CloudService; size?: "sm" | "md" | "lg" }) {
  const cfg = SERVICE_CONFIG[service];
  const dim = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-lg" : "w-9 h-9 text-sm";
  const initials: Record<CloudService, string> = {
    "google-sheets": "GS", "google-drive": "GD", dropbox: "DB",
    onedrive: "OD", notion: "N", email: "✉",
  };
  return (
    <div className={`${dim} ${cfg.bg} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials[service]}
    </div>
  );
}

function StatusDot({ status }: { status: "idle" | "syncing" | "success" | "error" | "connected" | "disconnected" }) {
  const map: Record<string, string> = {
    idle: "bg-slate-300",
    syncing: "bg-amber-400 animate-pulse",
    success: "bg-emerald-500",
    error: "bg-rose-500",
    connected: "bg-emerald-500",
    disconnected: "bg-slate-300",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] ?? "bg-slate-300"}`} />;
}

function FormatPill({ format }: { format: ExportFormat }) {
  const colors: Record<ExportFormat, string> = {
    csv: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    json: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    excel: "bg-green-50 text-green-700 ring-1 ring-green-200",
    pdf: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors[format]}`}>{FORMAT_LABELS[format]}</span>;
}

function QRCode({ code }: { code: string }) {
  const grid = codeToQRGrid(code);
  return (
    <svg viewBox="0 0 23 23" className="w-28 h-28" shapeRendering="crispEdges">
      <rect width={23} height={23} fill="white" />
      {grid.flatMap((row, i) =>
        row.map((cell, j) =>
          cell ? <rect key={`${i}-${j}`} x={j + 1} y={i + 1} width={1} height={1} fill="#0f172a" /> : null
        )
      )}
    </svg>
  );
}

// ─── Templates Panel ──────────────────────────────────────────────────────────

function TemplatesPanel({
  expenses, integrations, exporting,
  onExport,
}: {
  expenses: Expense[];
  integrations: CloudIntegration[];
  exporting: boolean;
  onExport: (t: ExportTemplate, f: ExportFormat, d: ExportDestination) => void;
}) {
  const [selected, setSelected] = useState<ExportTemplate | null>(null);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [destination, setDestination] = useState<ExportDestination>("download");
  const [done, setDone] = useState<ExportTemplate | null>(null);

  const connectedServices = integrations.filter((i) => i.connected).map((i) => i.id);

  const handleExport = useCallback(async () => {
    if (!selected) return;
    await onExport(selected, format, destination);
    setDone(selected);
    setTimeout(() => { setDone(null); setSelected(null); }, 2000);
  }, [selected, format, destination, onExport]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {(Object.keys(TEMPLATE_CONFIG) as ExportTemplate[]).map((t) => {
          const cfg = TEMPLATE_CONFIG[t];
          const isSelected = selected === t;
          const isDone = done === t;
          return (
            <div
              key={t}
              onClick={() => setSelected(isSelected ? null : t)}
              className={`relative bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
                isSelected ? `${cfg.accentBorder} shadow-lg scale-[1.01]` : "border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200"
              }`}
            >
              {cfg.badge && (
                <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  {cfg.badge}
                </span>
              )}
              <div className="p-5">
                <div className="text-3xl mb-3">{cfg.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cfg.label}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-3">{cfg.description}</p>
                <div className="flex flex-wrap gap-1">
                  {cfg.formats.map((f) => <FormatPill key={f} format={f} />)}
                </div>
              </div>

              {isSelected && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Format</label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as ExportFormat)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        {cfg.formats.map((f) => (
                          <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Send to</label>
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value as ExportDestination)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="download">⬇ Download</option>
                        {connectedServices.map((s) => (
                          <option key={s} value={s}>{SERVICE_CONFIG[s].shortLabel}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exporting || isDone}
                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : exporting
                        ? "bg-indigo-400 text-white cursor-wait"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                    }`}
                  >
                    {isDone ? "✓ Exported!" : exporting ? "Processing…" : `Export ${cfg.label}`}
                  </button>
                  <p className="text-center text-xs text-slate-400">{expenses.length} expenses · ~{formatBytes(expenses.length * 90)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Integrations Panel ───────────────────────────────────────────────────────

function IntegrationsPanel({
  integrations, connecting, syncing,
  onConnect, onDisconnect, onSync, onToggleAutoSync,
}: {
  integrations: CloudIntegration[];
  connecting: CloudService | null;
  syncing: CloudService | null;
  onConnect: (s: CloudService, email: string) => void;
  onDisconnect: (s: CloudService) => void;
  onSync: (s: CloudService) => void;
  onToggleAutoSync: (s: CloudService) => void;
}) {
  const [connectingModal, setConnectingModal] = useState<CloudService | null>(null);
  const [email, setEmail] = useState("me@gmail.com");

  const handleConnect = () => {
    if (!connectingModal || !email) return;
    onConnect(connectingModal, email);
    setConnectingModal(null);
  };

  return (
    <div className="space-y-4">
      {connectingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setConnectingModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <ServiceLogo service={connectingModal} size="lg" />
              <div>
                <h3 className="font-bold text-slate-900">Connect {SERVICE_CONFIG[connectingModal].label}</h3>
                <p className="text-slate-500 text-xs">{SERVICE_CONFIG[connectingModal].description}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Account email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConnectingModal(null)} className="flex-1 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting === connectingModal}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {connecting === connectingModal ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const cfg = SERVICE_CONFIG[integration.id];
          const isSyncing = syncing === integration.id || integration.syncStatus === "syncing";
          return (
            <div key={integration.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ServiceLogo service={integration.id} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{cfg.label}</h3>
                      <StatusDot status={integration.connected ? "connected" : "disconnected"} />
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{cfg.description}</p>
                  </div>
                </div>
              </div>

              {integration.connected ? (
                <>
                  <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Account</span>
                      <span className="text-slate-800 font-medium">{integration.accountEmail}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Last sync</span>
                      <span className={`font-medium ${isSyncing ? "text-amber-600" : "text-slate-800"}`}>
                        {isSyncing ? "Syncing now…" : integration.lastSync ? relativeTime(integration.lastSync) : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-500">Auto-sync</span>
                      <button
                        onClick={() => onToggleAutoSync(integration.id)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${integration.autoSync ? "bg-indigo-500" : "bg-slate-200"}`}
                      >
                        <span className={`inline-block w-3 h-3 bg-white rounded-full shadow transition-transform ${integration.autoSync ? "translate-x-3.5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSync(integration.id)}
                      disabled={isSyncing}
                      className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                    >
                      {isSyncing ? "Syncing…" : "Sync Now"}
                    </button>
                    <button
                      onClick={() => onDisconnect(integration.id)}
                      className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setConnectingModal(integration.id)}
                  disabled={connecting === integration.id}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
                    connecting === integration.id
                      ? "bg-slate-100 text-slate-400 cursor-wait"
                      : `${cfg.bg} text-white hover:opacity-90 active:scale-95`
                  }`}
                >
                  {connecting === integration.id ? "Connecting…" : `Connect ${cfg.shortLabel}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule Panel ───────────────────────────────────────────────────────────

function SchedulePanel({
  schedules, integrations,
  onCreate, onToggle, onDelete,
}: {
  schedules: ScheduledExport[];
  integrations: CloudIntegration[];
  onCreate: (data: Omit<ScheduledExport, "id" | "createdAt" | "nextRun">) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [template, setTemplate] = useState<ExportTemplate>("full-export");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(9);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [destination, setDestination] = useState<ExportDestination>("email");
  const [saved, setSaved] = useState(false);

  const connectedDests: ExportDestination[] = [
    "download",
    ...integrations.filter((i) => i.connected).map((i) => i.id),
  ];

  const handleCreate = () => {
    if (!label) return;
    onCreate({ label, enabled: true, frequency, dayOfWeek, dayOfMonth, hour, format, template, destination });
    setLabel("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const destLabel = (d: ExportDestination) =>
    d === "download" ? "⬇ Download" : SERVICE_CONFIG[d].shortLabel;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Create form */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 mb-0.5">New Schedule</h3>
          <p className="text-slate-500 text-xs">Set up automatic recurring exports.</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Weekly Backup"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value as ExportTemplate)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
              {(Object.keys(TEMPLATE_CONFIG) as ExportTemplate[]).map((t) => (
                <option key={t} value={t}>{TEMPLATE_CONFIG[t].label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                {(["daily", "weekly", "monthly"] as const).map((f) => (
                  <option key={f} value={f}>{FREQ_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                {frequency === "weekly" ? "Day" : frequency === "monthly" ? "Day of Month" : "Time"}
              </label>
              {frequency === "weekly" ? (
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              ) : frequency === "monthly" ? (
                <select value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <option key={h} value={h}>{h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                {(["csv", "json", "excel", "pdf"] as ExportFormat[]).map((f) => (
                  <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Send to</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value as ExportDestination)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                {connectedDests.map((d) => (
                  <option key={d} value={d}>{destLabel(d)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={!label || saved}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            saved ? "bg-emerald-500 text-white" : !label ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
          }`}
        >
          {saved ? "✓ Schedule Created!" : "Create Schedule"}
        </button>
      </div>

      {/* Active schedules */}
      <div className="lg:col-span-3 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm px-1">Active Schedules</h3>
        {schedules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">⏰</div>
            <p className="text-slate-600 font-medium text-sm">No schedules yet</p>
            <p className="text-slate-400 text-xs mt-1">Create one to automate your exports.</p>
          </div>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${s.enabled ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{s.label}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{FREQ_LABELS[s.frequency]}</span>
                    <FormatPill format={s.format} />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {TEMPLATE_CONFIG[s.template].label} → {s.destination === "download" ? "Download" : SERVICE_CONFIG[s.destination].shortLabel}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-slate-400">Next: <span className="text-indigo-600 font-medium">{timeUntil(s.nextRun)}</span></span>
                    {s.lastRun && (
                      <span className="text-xs text-slate-400">
                        Last: <span className={s.lastStatus === "success" ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                          {relativeTime(s.lastRun)} {s.lastStatus === "success" ? "✓" : "✗"}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onToggle(s.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.enabled ? "bg-indigo-500" : "bg-slate-200"}`}
                    aria-label={s.enabled ? "Disable schedule" : "Enable schedule"}
                  >
                    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${s.enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                  </button>
                  <button onClick={() => onDelete(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" aria-label="Delete schedule">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  expenses,
  exporting,
  onDelete,
  onReExport,
}: {
  history: ExportRecord[];
  expenses: Expense[];
  exporting: boolean;
  onDelete: (id: string) => void;
  onReExport: (t: ExportTemplate, f: ExportFormat, d: ExportDestination) => void;
}) {
  const [filter, setFilter] = useState<ExportTemplate | "all">("all");
  const filtered = filter === "all" ? history : history.filter((h) => h.template === filter);

  const destDisplay = (d: ExportDestination) =>
    d === "download"
      ? { label: "Download", className: "bg-slate-100 text-slate-600" }
      : { label: SERVICE_CONFIG[d].shortLabel, className: "bg-indigo-50 text-indigo-700" };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === "all" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
          All ({history.length})
        </button>
        {(Object.keys(TEMPLATE_CONFIG) as ExportTemplate[]).filter((t) => history.some((h) => h.template === t)).map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === t ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
            {TEMPLATE_CONFIG[t].icon} {TEMPLATE_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-600 font-medium text-sm">No exports yet</p>
          <p className="text-slate-400 text-xs mt-1">Your export history will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {filtered.map((record) => {
            const dest = destDisplay(record.destination);
            return (
              <div key={record.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="flex-shrink-0 text-xl">{TEMPLATE_CONFIG[record.template].icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{TEMPLATE_CONFIG[record.template].label}</span>
                    <FormatPill format={record.format} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dest.className}`}>{dest.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${record.status === "success" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                      {record.status === "success" ? "✓ Success" : "✗ Failed"}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {record.expenseCount} expenses {record.sizeBytes ? `· ${formatBytes(record.sizeBytes)}` : ""} · {relativeTime(record.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {record.status === "success" && record.destination === "download" && (
                    <button
                      onClick={() => onReExport(record.template, record.format, record.destination)}
                      disabled={exporting}
                      title="Re-download"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  )}
                  <button onClick={() => onDelete(record.id)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Share Panel ──────────────────────────────────────────────────────────────

function SharePanel({
  shareLinks,
  onGenerate,
  onRevoke,
}: {
  shareLinks: ShareLink[];
  onGenerate: (t: ExportTemplate, p: "view" | "download", days: number) => ShareLink;
  onRevoke: (id: string) => void;
}) {
  const [template, setTemplate] = useState<ExportTemplate>("monthly-summary");
  const [permission, setPermission] = useState<"view" | "download">("view");
  const [expiry, setExpiry] = useState(7);
  const [newLink, setNewLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const BASE_URL = "https://spendsmart.app/s";

  const handleGenerate = () => {
    const link = onGenerate(template, permission, expiry);
    setNewLink(link);
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/${code}`).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Generate form */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 mb-0.5">Generate Share Link</h3>
            <p className="text-slate-500 text-xs">Create a secure, time-limited link to your expense report.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Report template</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value as ExportTemplate)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                {(Object.keys(TEMPLATE_CONFIG) as ExportTemplate[]).map((t) => (
                  <option key={t} value={t}>{TEMPLATE_CONFIG[t].icon} {TEMPLATE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Permission</label>
              <div className="flex gap-2">
                {(["view", "download"] as const).map((p) => (
                  <button key={p} onClick={() => setPermission(p)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${permission === p ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    {p === "view" ? "👁 View Only" : "⬇ Can Download"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Expires in</label>
              <div className="flex gap-2">
                {[1, 7, 30].map((d) => (
                  <button key={d} onClick={() => setExpiry(d)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${expiry === d ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    {d === 1 ? "1 day" : d === 7 ? "7 days" : "30 days"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleGenerate} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all">
            Generate Link
          </button>
        </div>

        {newLink && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-semibold">Link created!</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 px-3 py-2">
              <span className="text-xs text-slate-600 font-mono flex-1 truncate">{BASE_URL}/{newLink.code}</span>
              <button onClick={() => copyLink(newLink.code)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex-shrink-0">
                {copied === newLink.code ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-emerald-600">Expires {timeUntil(newLink.expiresAt)}</p>
          </div>
        )}
      </div>

      {/* Active links */}
      <div className="lg:col-span-3 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm px-1">Share Links</h3>
        {shareLinks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <p className="text-slate-600 font-medium text-sm">No links generated</p>
            <p className="text-slate-400 text-xs mt-1">Create your first shareable report link.</p>
          </div>
        ) : (
          shareLinks.map((link) => {
            const expired = new Date(link.expiresAt) < new Date();
            return (
              <div key={link.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${!link.active || expired ? "opacity-60" : "border-slate-100"}`}>
                <div className="flex gap-4">
                  {/* QR code */}
                  <div className="flex-shrink-0 bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
                    <QRCode code={link.code} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{TEMPLATE_CONFIG[link.template].label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${link.permission === "view" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                            {link.permission === "view" ? "View only" : "Download"}
                          </span>
                          {(!link.active || expired) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium">Expired</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {link.accessCount} views · expires {expired ? "expired" : timeUntil(link.expiresAt)}
                        </p>
                      </div>
                      {link.active && !expired && (
                        <button onClick={() => onRevoke(link.id)} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex-shrink-0">
                          Revoke
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5">
                      <span className="text-xs text-slate-500 font-mono flex-1 truncate">{BASE_URL}/{link.code}</span>
                      {link.active && !expired && (
                        <button onClick={() => copyLink(link.code)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex-shrink-0">
                          {copied === link.code ? "Copied!" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export function CloudExportHub({ expenses }: { expenses: Expense[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("Templates");
  const {
    integrations, history, schedules, shareLinks, isLoaded,
    connecting, syncing, exporting,
    connectIntegration, disconnectIntegration, syncNow, toggleAutoSync,
    exportTemplate, createSchedule, toggleSchedule, deleteSchedule,
    generateShareLink, revokeShareLink, deleteHistoryEntry,
  } = useCloudExport();

  const connectedCount = integrations.filter((i) => i.connected).length;
  const activeSchedules = schedules.filter((s) => s.enabled).length;

  const handleExport = useCallback(
    (t: ExportTemplate, f: ExportFormat, d: ExportDestination) => exportTemplate(t, f, d, expenses),
    [exportTemplate, expenses]
  );

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 px-6 md:px-8 pt-8 pb-6">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-xl">
              ☁️
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Export &amp; Sync Hub</h1>
              <p className="text-indigo-300 text-sm">Connect your tools, automate backups, and share reports</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-5 flex-wrap">
            {[
              { label: "Connected services", value: connectedCount, of: integrations.length, color: "text-emerald-400" },
              { label: "Total exports", value: history.length, color: "text-blue-300" },
              { label: "Active schedules", value: activeSchedules, color: "text-violet-300" },
              { label: "Share links", value: shareLinks.filter((l) => l.active).length, color: "text-amber-300" },
            ].map(({ label, value, of: total, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 min-w-[120px]">
                <p className={`text-2xl font-bold ${color}`}>
                  {value}{total !== undefined ? <span className="text-white/40 text-lg">/{total}</span> : ""}
                </p>
                <p className="text-indigo-300 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Connected services quick bar */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {integrations.filter((i) => i.connected).map((i) => (
              <div key={i.id} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                <StatusDot status={i.syncStatus === "syncing" ? "syncing" : "connected"} />
                <span className="text-white/80 text-xs font-medium">{SERVICE_CONFIG[i.id].shortLabel}</span>
              </div>
            ))}
            {integrations.filter((i) => !i.connected).map((i) => (
              <div key={i.id} className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1">
                <StatusDot status="disconnected" />
                <span className="text-white/30 text-xs">{SERVICE_CONFIG[i.id].shortLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-slate-100 px-6 md:px-8 sticky top-0 z-10 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const counts: Partial<Record<Tab, number>> = {
              Integrations: connectedCount,
              Schedule: activeSchedules,
              History: history.length,
              Share: shareLinks.filter((l) => l.active).length,
            };
            const count = counts[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab}
                {count !== undefined && count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 px-6 md:px-8 py-6 max-w-6xl w-full">
        {activeTab === "Templates" && (
          <TemplatesPanel
            expenses={expenses}
            integrations={integrations}
            exporting={exporting}
            onExport={handleExport}
          />
        )}
        {activeTab === "Integrations" && (
          <IntegrationsPanel
            integrations={integrations}
            connecting={connecting}
            syncing={syncing}
            onConnect={connectIntegration}
            onDisconnect={disconnectIntegration}
            onSync={syncNow}
            onToggleAutoSync={toggleAutoSync}
          />
        )}
        {activeTab === "Schedule" && (
          <SchedulePanel
            schedules={schedules}
            integrations={integrations}
            onCreate={createSchedule}
            onToggle={toggleSchedule}
            onDelete={deleteSchedule}
          />
        )}
        {activeTab === "History" && (
          <HistoryPanel
            history={history}
            expenses={expenses}
            exporting={exporting}
            onDelete={deleteHistoryEntry}
            onReExport={handleExport}
          />
        )}
        {activeTab === "Share" && (
          <SharePanel
            shareLinks={shareLinks}
            onGenerate={generateShareLink}
            onRevoke={revokeShareLink}
          />
        )}
      </div>
    </div>
  );
}
