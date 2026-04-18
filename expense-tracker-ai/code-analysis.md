# Export Feature Branch Analysis

Comparative technical analysis of three data export implementations for the SpendSmart expense tracker.

---

## Table of Contents

1. [Branch Overview](#branch-overview)
2. [V1 — Simple CSV Export](#v1--simple-csv-export)
3. [V2 — Advanced Multi-Format Export Modal](#v2--advanced-multi-format-export-modal)
4. [V3 — Cloud-Integrated Export Hub](#v3--cloud-integrated-export-hub)
5. [Cross-Branch Comparison](#cross-branch-comparison)

---

## Branch Overview

| | `feature-data-export-v1` | `feature-data-export-v2` | `feature-data-export-v3` |
|---|---|---|---|
| **Concept** | Single-click CSV download | Modal with format + filter options | Full cloud export hub with sharing |
| **New files** | 0 (modifies 2 existing) | 2 | 4 |
| **New dependencies** | 0 | 0 | 0 |
| **Lines of code added** | ~22 | ~700 | ~1,400 |
| **Complexity** | Low | Medium | High |
| **Functional?** | Yes | Mostly | Partially |

---

## V1 — Simple CSV Export

### Files Created / Modified

| Status | Path |
|--------|------|
| Modified | `expense-tracker-ai/app/page.tsx` |
| Modified | `expense-tracker-ai/lib/export.ts` |

The branch modifies two files that already existed on `main`. The `lib/export.ts` file gains the core `exportToCSV` function; `app/page.tsx` gains a single "Export Data" button. No new files, no structural additions.

### Architecture Overview

The feature follows the app's existing single-page client architecture: a `"use client"` page component orchestrates state from `useExpenses()` (a localStorage hook), and a pure utility function in `lib/` handles the actual file generation. There is no server involvement.

```
app/page.tsx              ← "Export Data" button (one-liner onClick)
  lib/export.ts           ← exportToCSV(): CSV string → Blob → anchor download
  hooks/useExpenses.ts    ← provides expenses[] from localStorage
```

### Key Components and Responsibilities

**`lib/export.ts` — `exportToCSV(expenses: Expense[]): void`**
The entire implementation is a single ~20-line pure function:
1. Builds a 2D array: one header row + one row per expense.
2. Joins into a CSV string with comma-delimited columns and `\n` line endings.
3. Creates a `Blob`, generates an object URL, programmatically clicks a hidden `<a>` element to download, revokes the URL.

**`app/page.tsx` — `DashboardPage`**
The only UI change: wraps the existing "Add Expense" button in a flex container and prepends a new "Export Data" `<button>` whose `onClick` is `() => exportToCSV(expenses)`. No new state, no modal, no intermediary.

### Libraries and Dependencies Used

Zero new dependencies. Uses only browser-native APIs:
- `Blob`, `URL.createObjectURL`, `URL.revokeObjectURL`
- `document.createElement`, `document.body.appendChild/removeChild`

Existing internal utilities: `formatDate` from `lib/utils.ts`, `Expense` type from `lib/types.ts`.

### Implementation Patterns

**CSV construction — manual string assembly:**
```ts
const headers = ["Date", "Category", "Amount", "Description"];
const rows = expenses.map((e) => [
  formatDate(e.date),
  e.category,
  e.amount.toFixed(2),
  `"${e.description.replace(/"/g, '""')}"`,
]);
const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
```

**Selective quoting**: only the `Description` field is quoted (handles commas and embedded double-quotes). Amount, category, and date are unquoted.

**Note on column order**: this branch changed the column order from main's `Date, Category, Description, Amount` to `Date, Category, Amount, Description` — this is an intentional spec fix called out in the commit message.

**Browser download trigger — anchor injection:**
```ts
const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

### Code Complexity

**Low.** The full diff is 22 added lines / 9 removed lines. No branching logic beyond `.map()`, no async, no new state. The function is trivially testable in a browser test environment.

### Error Handling

**None.** Unhandled scenarios:
- **Empty expenses array**: produces a headers-only CSV with no user feedback.
- **`Blob` / `URL.createObjectURL` unavailable**: unhandled `TypeError`.
- **Malformed date in storage**: `formatDate` would produce "Invalid Date" silently.
- **No success/failure feedback**: the button click either downloads silently or fails silently.

### Security Considerations

- **CSV injection**: descriptions starting with `=`, `+`, `-`, `@` are not sanitized. A value like `=HYPERLINK("http://evil.com","click")` would be interpreted as a formula by Excel/Sheets. Fix: prepend `'` or strip leading special characters from all string fields.
- **No UTF-8 BOM**: the Blob lacks a `\uFEFF` prefix. Excel on Windows may misinterpret non-ASCII characters in descriptions.
- **Line endings**: uses `\n` (LF) rather than `\r\n` (CRLF). RFC 4180 specifies CRLF; some older Windows parsers may mishandle LF-only files.
- No server-side attack surface; no network egress.

### Performance Implications

Negligible at typical personal-use scale. The entire dataset is materialized into a single string in memory before Blob creation — no streaming. For 100k+ records, memory could be a concern, but this is not a realistic scenario for a personal expense tracker.

### Extensibility and Maintainability

**Strengths:** `lib/export.ts` is cleanly separated from the component. Adding JSON or XLSX export would mean adding new exported functions to the same file without touching the component.

**Limitations:**
- No filtering before export — all data always exported, no date range or category selection.
- Only CSV is supported; no format choice.
- Column header strings are hardcoded inline — a maintenance hazard if field names change.
- `formatDate` produces a locale-formatted string ("Apr 18, 2026") — human-readable but not machine-parseable, reducing CSV utility for re-import.
- No confirmation dialog — single click with no undo.

### Technical Deep Dive

**How export works end-to-end:**

1. User clicks "Export Data" on the dashboard.
2. `onClick`: `() => exportToCSV(expenses)` — `expenses` is live React state from `useExpenses()`, reflecting current `localStorage` contents.
3. `exportToCSV` builds the CSV string, wraps in a `Blob`, triggers a programmatic anchor download with filename `expenses-YYYY-MM-DD.csv`.
4. No state changes, no re-renders, no network requests.

**State management:** None. The export is a pure side effect — fire and forget.

**Edge cases:**

| Scenario | Behaviour |
|---|---|
| No expenses | Downloads headers-only CSV — no user warning |
| Description contains commas | Handled (field is quoted) |
| Description contains `"` | Handled (`""` escaping) |
| Description contains `\n` | Embedded newline in quoted field — technically valid RFC 4180, but may break naive parsers |
| Description starts with `=` | Not sanitized — formula injection risk |
| Amount with >2 decimal places | `toFixed(2)` correctly rounds |
| Called during SSR | Would throw `ReferenceError: document is not defined`, but `"use client"` prevents SSR execution |

---

## V2 — Advanced Multi-Format Export Modal

### Files Created / Modified

| Status | Path |
|--------|------|
| Added | `expense-tracker-ai/lib/exportV2.ts` |
| Added | `expense-tracker-ai/components/export/ExportModal.tsx` |
| Modified | `expense-tracker-ai/app/expenses/page.tsx` |
| Modified | `expense-tracker-ai/components/expenses/ExpenseFilters.tsx` |
| Modified | `expense-tracker-ai/app/layout.tsx` |
| Modified | `expense-tracker-ai/next.config.ts` |

The `next.config.ts` change (`turbopack: { root: process.cwd() }`) is a separate Turbopack config fix unrelated to the export feature — it should ideally be a separate commit/PR.

### Architecture Overview

The feature introduces a **modal-first export flow** to replace the previous single-button immediate download. Architecture follows the existing pattern: thin page component orchestrates state, a presentational modal component handles UI, and a pure utility library handles the export mechanics.

```
ExpensesPage                           ← useState: showExport
  → ExpenseFiltersBar (onExport prop)  ← "Export" button triggers modal open
  → ExportModal (expenses[])
       useMemo: applyExportFilters()   ← live preview of filtered data
       handleExport()
         → runExport(preview, config)  ← dispatcher
              → exportCSV()           ← Blob download
              → exportJSON()          ← Blob download (strips id/createdAt)
              → exportPDF()           ← window.open + document.write + print()
```

**Behavioral note**: the old `app/expenses/page.tsx` passed the currently page-filtered list directly to the exporter. This branch passes the full unfiltered `expenses[]` to `ExportModal`, which performs its own independent filtering. Page-level active filters no longer seed the export scope — a subtle but meaningful UX change.

### Key Components and Responsibilities

**`lib/exportV2.ts`** — Pure utility module, no React imports.
- `ExportFormat` / `ExportConfig` types define the export contract.
- `applyExportFilters(expenses, config)` — filters by date range and category set. Used for both the live preview and the actual export data.
- `runExport(expenses, config)` — switches on `config.format`, dispatches to the appropriate handler.
- `exportCSV(expenses, config)` — CSV string → Blob download.
- `exportJSON(expenses, config)` — strips `id` and `createdAt` before serializing, JSON Blob download.
- `exportPDF(expenses, config)` — `window.open` + `document.write` full HTML document + 400ms setTimeout + `win.print()`.
- `triggerDownload(blob, filename)` — shared Blob download utility.
- `escapeHtml(str)` — XSS-safe string escaping for use in the print HTML document.

**`components/export/ExportModal.tsx`** (~330 lines) — `"use client"` Client Component.
- Two-column layout: left panel = configuration (format, date range, category multi-select, filename), right panel = scrollable live preview table.
- Reads `useCurrency()` to format amounts with `Intl.NumberFormat`.
- Passes full `expenses[]` as prop; filters internally via `useMemo(applyExportFilters, [deps])`.
- Modal lifecycle: `isOpen` guard, ESC key listener, `overflow: hidden` on body, reset-on-open via two `useEffect`s.
- Export button has three states: idle (indigo), loading (spinner + fake 600ms delay), success (green checkmark auto-reset after 2500ms).

**`app/expenses/page.tsx`** — Minimal change: replaces inline `handleExport` call with `setShowExport(true)`, renders `<ExportModal>`.

**`components/expenses/ExpenseFilters.tsx`** — Minimal change: button label "Export CSV" → "Export".

### Libraries and Dependencies Used

No new dependencies. Uses only the existing stack:

| Library | Usage |
|---|---|
| React 19 | `useState`, `useMemo`, `useEffect`, `useCallback` |
| Tailwind CSS v4 | All styling |
| TypeScript | Strict typing throughout |

No third-party PDF library — PDF is implemented entirely via `window.open` + `document.write` + `window.print()`. Zero-dependency, but with significant trade-offs (see below).

### Implementation Patterns

- **Separation of concerns**: UI stays in the component, file generation stays in the utility. The component never builds strings or Blobs directly.
- **`useMemo` for derived state**: `preview` and `previewTotal` are memoized. `applyExportFilters` runs synchronously on every filter change.
- **`useCallback` for stable handlers**: `toggleCategory` and `toggleAll` avoid unnecessary re-renders.
- **`Set<Category>` for multi-select state**: O(1) lookups, converted to array only at filter/export call sites.
- **`FORMAT_META` config object**: maps format keys to display label, icon, description, MIME type. Avoids per-format conditionals scattered through JSX; adding a new format is purely additive.
- **Fake async delay**: `await new Promise(r => setTimeout(r, 600))` to animate the spinner. Actual export operations are synchronous.
- **Self-contained print document**: `buildPrintHTML` produces a full `<!DOCTYPE html>` with embedded CSS and `@media print` rules.

### Code Complexity

- `lib/exportV2.ts`: **Low** — well-decomposed pure functions, each short and independent.
- `components/export/ExportModal.tsx`: **Medium** — ~330 lines, 7 `useState` slices, two-column responsive layout. Not deeply nested in logic, but breadth adds up.
- `app/expenses/page.tsx`: **Low** — trivial change.

### Error Handling

Weak overall:
- **PDF popup blocked**: `if (!win) return` — silently exits. The button still shows "Downloaded!" even though nothing opened. No user feedback.
- **CSV/JSON Blob creation**: no `try/catch` — failures throw unhandled exceptions.
- **Date filter comparison**: lexicographic string comparison (`e.date >= config.dateFrom`). Works correctly for ISO `YYYY-MM-DD` but silently misfilters on malformed dates.
- **Filename input**: no sanitization — characters illegal in filenames (`/`, `\`, `:`) are passed through to the OS.
- **Empty export guard**: `if (preview.length === 0) return` disables the button correctly.

### Security Considerations

**Positive:**
- `escapeHtml()` applied to all user-supplied strings before injection into the print HTML document — prevents XSS in the print window.
- `exportJSON` explicitly strips `id` and `createdAt`: `const payload = expenses.map(({ id: _id, createdAt: _c, ...rest }) => rest)` — deliberate privacy decision.

**Risks:**
- **CSV injection**: description fields are quoted but not sanitized for formula-injection characters (`=`, `+`, `-`, `@`). Spreadsheet applications would interpret these as formulas.
- **Raw values in print HTML**: `e.date` and `e.category` are inserted into the print document without `escapeHtml()`. Both are app-controlled enum/date values so this is currently safe, but easy to regress.
- **Hardcoded "Amount (USD)"**: the CSV column header is hardcoded regardless of the app's selected currency. GBP or EUR amounts would be mislabeled.

### Performance Implications

- **`useMemo` recalculation**: `applyExportFilters` runs synchronously on every keystroke. Fine for typical personal-use datasets.
- **Live preview table**: non-virtualized `<table>` rendering all filtered results. Could degrade with large datasets.
- **PDF `setTimeout(400ms)`**: heuristic delay before `win.print()`. Can fail if the browser is slow to load the document.
- **Fake 600ms loading delay**: cosmetic UX; adds latency with no functional benefit.

### Extensibility and Maintainability

**Strengths:**
- Adding a new format: add one entry to `FORMAT_META` and one case to the switch in `runExport`. The UI adapts automatically.
- `ExportConfig` interface means adding new config fields doesn't break call sites.
- Export logic fully decoupled from the component — testable in isolation.

**Weaknesses:**
- The 7 `useState` variables in `ExportModal` could be consolidated into a `useReducer` for cleaner reset logic.
- The modal at ~330 lines is approaching the size where splitting the config panel and preview table into sub-components would improve readability.
- `ExportConfig.categories/dateFrom/dateTo` fields are passed to `runExport` but never used inside it (filtering is done before `runExport` is called). The interface is misleadingly over-specified.

### Technical Deep Dive

**End-to-end flow:**

1. User clicks "Export" in the expense filters bar → `setShowExport(true)` → `ExportModal` mounts with full `expenses[]`.
2. Modal `useEffect` resets all state to defaults: format=csv, empty date range, all categories selected, filename=`expenses-YYYY-MM-DD`.
3. **Live preview**: every filter change re-derives `preview = applyExportFilters(expenses, config)` synchronously via `useMemo`.
4. User clicks "Export" in the modal:
   ```ts
   const handleExport = async () => {
     if (preview.length === 0) return;
     setIsExporting(true);
     await new Promise(r => setTimeout(r, 600)); // spinner UX
     const config = { format, dateFrom, dateTo, categories: Array.from(selectedCategories),
       filename: filename.trim() || defaultFilename() };
     runExport(preview, config);  // already-filtered data passed in
     setIsExporting(false);
     setExported(true);
     setTimeout(() => setExported(false), 2500);
   };
   ```
5. `runExport` switches on format, calls the appropriate handler, which creates a Blob and triggers download.

**Per-format file generation:**

| Format | Approach | Notable detail |
|---|---|---|
| CSV | `[headers, ...rows].map(r=>r.join(",")).join("\n")` → Blob download | Line endings are LF not CRLF; no UTF-8 BOM; "Amount (USD)" header hardcoded |
| JSON | `JSON.stringify(payload, null, 2)` → Blob download | Strips `id` and `createdAt` |
| PDF | `window.open` + `document.write` full HTML + 400ms delay + `win.print()` | Silently fails if popup blocked |

**Edge cases:**

| Scenario | Behaviour |
|---|---|
| Zero records match filters | Export button disabled (correct) |
| No categories selected | Button disabled; amber warning shown (correct) |
| Popup blocker blocks PDF | Silent failure; success state still shown |
| Description with `\n` in CSV | Embedded newline breaks row in naive parsers |
| Description starts with `=` | Formula injection risk |
| Filename contains `/` | Passed through — OS behavior undefined |

---

## V3 — Cloud-Integrated Export Hub

### Files Created / Modified

| Status | Path |
|--------|------|
| Added | `app/export/page.tsx` |
| Added | `components/export/CloudExportHub.tsx` |
| Added | `hooks/useCloudExport.ts` |
| Added | `lib/cloudExportTypes.ts` |
| Modified | `components/layout/Sidebar.tsx` |

The sidebar change adds a single "Export & Sync" navigation item pointing to `/export`. Everything else is new files.

### Architecture Overview

The feature introduces a dedicated `/export` route with a full-screen "cloud export hub" UI. Like the rest of the app, it is entirely client-side — no Route Handlers, no Server Actions, no real network calls. All "cloud integrations" and "scheduled exports" are simulated with `setTimeout` delays and localStorage persistence.

```
app/export/page.tsx             ← route entry, calls useExpenses(), renders hub
  └─ CloudExportHub.tsx         ← monolithic UI hub (~1004 lines)
       └─ useCloudExport.ts     ← all state + business logic hook
            └─ cloudExportTypes.ts  ← pure TypeScript types
```

The hub contains five tab panels as private co-located sub-components (not exported):
- **TemplatesPanel** — 6 export templates as cards; format/destination selectors; calls `exportTemplate`
- **IntegrationsPanel** — 6 cloud service cards; simulated OAuth modal; sync/disconnect/auto-sync toggles
- **SchedulePanel** — create/list/toggle/delete recurring export schedules
- **HistoryPanel** — filterable timeline of all export records; re-download and delete
- **SharePanel** — link generator with expiry/permission config; QR codes; copy-to-clipboard

### Key Components and Responsibilities

**`lib/cloudExportTypes.ts`** — 70 lines, pure type declarations.
Defines: `ExportFormat`, `ExportTemplate`, `CloudService`, `SyncStatus`, `ExportDestination`, `CloudIntegration`, `ExportRecord`, `ScheduledExport`, `ShareLink`.

**`hooks/useCloudExport.ts`** (~312 lines) — the state machine.
- Four `useState` slices: `integrations`, `history`, `schedules`, `shareLinks`
- Three transient loading states: `connecting`, `syncing`, `exporting`
- Bootstraps from localStorage on mount with rich seed data on first use
- Persists every mutation via internal `save()` helper inside functional setState callbacks
- 11 `useCallback`-wrapped mutation functions
- `buildContent()` — the actual file generation logic

**`components/export/CloudExportHub.tsx`** (~1004 lines) — monolithic UI hub.
- Tab routing via single `activeTab` state
- Gradient hero header + sticky tab bar
- Computed display values (connected service count, active schedule count, active link count)
- All five panel components defined inline (not exported)
- Helper functions: `relativeTime`, `timeUntil`, `formatBytes`, `codeToQRGrid`
- Presentational atoms: `ServiceLogo`, `StatusDot`, `FormatPill`, `QRCode`

**`app/export/page.tsx`** (22 lines) — thin route entry.
- Calls `useExpenses()`, shows full-screen spinner while loading
- Passes `expenses[]` to `<CloudExportHub>`

### Libraries and Dependencies Used

Zero new dependencies. Uses only the existing stack:

| Library | Usage |
|---|---|
| React 19 | `useState`, `useEffect`, `useCallback` |
| Next.js 16 | App Router, `next/link`, `usePathname` |
| Tailwind CSS v4 | All styling: gradients, `animate-spin`, `backdrop-blur-sm`, etc. |
| TypeScript | Strict typing |
| Browser APIs | `localStorage`, `URL.createObjectURL`, `navigator.clipboard` |

QR code rendering uses inline SVG arithmetic — no external QR library.

### Implementation Patterns

**Optimistic UI with fake async delays**: every async operation uses `setTimeout` to simulate network latency (1300ms for export, 1800ms for connect, 2200ms for sync), then immediately resolves. No real network calls are made.

**localStorage-as-database**: four separate keys (`ss-cloud-integrations`, `ss-cloud-history`, `ss-cloud-schedules`, `ss-cloud-sharelinks`). Mutation pattern: `setState(prev => { const next = mutate(prev); save(key, next); return next; })`.

**Seed-on-first-load**: on first visit, the hook seeds realistic fixture data — pre-connected services, historical exports, schedules, and share links. Makes the feature feel live immediately.

**`SERVICE_CONFIG` and `TEMPLATE_CONFIG` maps**: adding a new cloud service or export template is purely declarative — add an entry to the relevant constant map and the entire UI adapts automatically.

**Deterministic fake QR code**: `codeToQRGrid` draws QR finder patterns at three corners (matching real QR spec positioning) then fills the data region by cycling through character code bits. Cosmetically plausible but not scannable.

**Colocation of sub-components**: all five panel components and helper atoms live in one 1004-line file. Trades modularity for rapid development; a maintainability concern at this scale.

### Code Complexity

| File | Complexity | Reasoning |
|---|---|---|
| `cloudExportTypes.ts` | Low | Pure type declarations |
| `app/export/page.tsx` | Low | 22 lines, single concern |
| `hooks/useCloudExport.ts` | Medium | Well-structured; `buildContent` has per-template + per-format branching |
| `components/export/CloudExportHub.tsx` | **High** | 1004 lines, 5 inline panels, 4 helper functions, 4 atom components |

`codeToQRGrid` is the highest-complexity single function: nested loops, bit-shifting, three-corner finder-pattern drawing — all undocumented.

### Error Handling

Minimal and silently defensive:
- **localStorage reads/writes**: `try/catch` with empty catch blocks — silent failure, in-memory state continues unpersisted.
- **Clipboard API**: `.catch(() => {})` — failures silently swallowed; "Copied!" UI feedback still triggers.
- **Export failures**: every `exportTemplate` call hardcodes `status: "success"` in the history record. The `ExportRecord.status` type includes `'failed'` and `'pending'`, but actual runtime failures cannot occur.
- **PDF export**: `buildContent` returns an empty string for `pdf`; the download is skipped by the caller's guard (`if (destination === "download" && format !== "pdf")`). No user feedback.
- No input validation beyond checking `!label` for schedule names. Invalid emails in integration modals are accepted silently.
- No loading/error boundaries at the route or component level.

### Security Considerations

- **Integrations are entirely fake**: no OAuth flows, no real tokens, no credentials transmitted or stored. The "connect" modal takes a free-text email and simulates a 1.8s delay. Safe because it does nothing real, but misleading.
- **Share link code generation**: `Math.random().toString(36).slice(2, 10)` — cryptographically weak (`Math.random()` is not a CSPRNG). Acceptable for a prototype; must be replaced with `crypto.getRandomValues()` if wired to a real backend.
- **Hardcoded dead domain**: `BASE_URL = "https://spendsmart.app/s"` — share links resolve to a non-functional domain. No actual data is shared.
- **CSV injection**: description fields are RFC 4180-quoted but not sanitized for `=`, `+`, `-`, `@`. Formula injection risk if exported CSVs are opened in spreadsheet applications.
- **Clipboard writes**: uses async `navigator.clipboard.writeText` — requires HTTPS/localhost. No fallback for insecure contexts.
- No XSS risk from file generation: all output is constructed from structured typed data, not raw HTML injection.

### Performance Implications

- **Bundle size**: all code is `"use client"` — full 1000+ lines go into the client bundle.
- **CloudExportHub re-renders**: no `React.memo` on panel sub-components; any parent state change re-renders all panels, though sub-component unmounting/remounting is controlled by the `activeTab` conditional.
- **Non-virtualized history list**: `HistoryPanel` renders all filtered records in a plain `<table>`. Fine for typical data volume; could degrade with hundreds of records.
- **Four synchronous localStorage reads on mount**: imperceptible with small payloads.
- **Simulated delays**: 1.3–2.2s timeouts intentionally lock UI during simulated operations.
- **`codeToQRGrid`**: runs synchronously on every render of a share link card; produces a 21×21 SVG with up to 441 `<rect>` elements. Lightweight.

### Extensibility and Maintainability

**Strengths:**
- `cloudExportTypes.ts` can be extended independently.
- `SERVICE_CONFIG` / `TEMPLATE_CONFIG` maps make adding new services/templates purely declarative.
- `useCloudExport` cleanly separates state from UI — could be extracted and tested.
- `buildContent` is a well-defined function that could be moved to `lib/` and unit-tested.

**Weaknesses:**
- `CloudExportHub.tsx` at 1004 lines violates single-responsibility. Each panel should be its own file under `components/export/`.
- All sub-components are private to the file — cannot be independently imported, tested, or reused.
- **Scheduled exports never execute**: `nextRun` is a static offset calculated once at creation. No timer, service worker, or server-side scheduler exists. The `dayOfWeek`, `dayOfMonth`, `hour` fields are stored but never used in `nextRun` calculation.
- **Share links are non-functional**: `spendsmart.app` is a hardcoded dead domain.
- `ExportRecord.status` of `'pending'` is defined in the type but never set at runtime — type is over-specified.

### Technical Deep Dive

**File generation (`buildContent` in `useCloudExport.ts`):**

Accepts `(expenses, template, format)`, returns `{ content, mimeType, ext }`.

Template filtering applied first:
- `year-in-review`: filters to `e.date.startsWith(currentYear)`
- `monthly-summary`: filters to `e.date.startsWith("YYYY-MM")`
- All other templates: uses full expense list (no semantic differentiation between "full-export", "tax-report", "budget-overview", etc.)

Format branches:
| Format | Approach | Critical note |
|---|---|---|
| CSV | Manual header + rows, `replace(/"/g, '""')`, `\n` endings | No BOM; formula injection risk |
| JSON | `JSON.stringify(data, null, 2)` | Full Expense objects, no field stripping |
| Excel | Same as CSV but tab-separated, `.xlsx` extension | **Not a real XLSX binary** — it is a TSV with a misleading extension |
| PDF | Returns empty string; download skipped by caller | **Silent no-op** — PDF option appears but produces no file |

**Download trigger** — standard pattern:
```ts
const blob = new Blob([content], { type: mimeType });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url; a.download = filename;
document.body.appendChild(a); a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

**Cloud destinations**: when `destination !== "download"`, file generation and download are entirely skipped. A history record is created with `status: "success"`. No data is sent anywhere.

**Share link generation:**
```ts
const code = Math.random().toString(36).slice(2, 10);
const link = { id, code, url: `${BASE_URL}/${code}`, expiry, permission, accessCount: 0, active: true };
```
Stored in localStorage only. `accessCount` can never increment — no server tracks accesses.

**Scheduled exports:**
```ts
const nextRun = fromNow(freq === "daily" ? DAY : freq === "weekly" ? 7*DAY : 30*DAY);
```
Static timestamp calculated once at creation. `dayOfWeek`, `dayOfMonth`, `hour` fields are stored but ignored. No execution mechanism exists.

**Critical gaps summary:**

| Gap | Severity |
|---|---|
| Cloud integrations are 100% fake (no OAuth, no API calls, no sync) | High |
| PDF export silently produces no file | High |
| "Excel" export is actually a TSV with misleading `.xlsx` extension | Medium |
| Scheduled exports never execute | High |
| Share links resolve to a dead domain | High |
| Share link code uses `Math.random()` (not cryptographically secure) | Medium |
| `CloudExportHub.tsx` is 1004 lines in one file | Medium |
| All error states are silently swallowed | Medium |

---

## Cross-Branch Comparison

### Feature Matrix

| Capability | V1 | V2 | V3 |
|---|:---:|:---:|:---:|
| CSV export | ✅ | ✅ | ✅ |
| JSON export | ❌ | ✅ | ✅ |
| PDF export | ❌ | ✅ (popup) | ❌ (silent no-op) |
| Excel export | ❌ | ❌ | ⚠️ (actually TSV) |
| Date range filter | ❌ | ✅ | ✅ (per template) |
| Category filter | ❌ | ✅ | ❌ |
| Live preview | ❌ | ✅ | ❌ |
| Filename customization | ❌ | ✅ | ❌ |
| Cloud integration | ❌ | ❌ | ⚠️ (simulated) |
| Scheduled exports | ❌ | ❌ | ⚠️ (UI only) |
| Share links | ❌ | ❌ | ⚠️ (dead domain) |
| Error feedback | ❌ | ⚠️ (partial) | ❌ |
| CSV injection protection | ❌ | ❌ | ❌ |
| UTF-8 BOM for Excel compat | ❌ | ❌ | ❌ |

### Code Quality

| Dimension | V1 | V2 | V3 |
|---|---|---|---|
| Lines added | ~22 | ~700 | ~1,400 |
| New dependencies | 0 | 0 | 0 |
| Test coverage | None | None | None |
| Error handling | None | Partial/silent | Silent |
| Security (CSV injection) | Unmitigated | Unmitigated | Unmitigated |
| Component size | Small | Medium | Very large (1004 lines) |
| Separation of concerns | Good | Good | Partial (hub is monolithic) |
| Functional completeness | Full | Mostly full | Partial |

### Recommendation

- **V1** is the only version where every advertised feature actually works. It is minimal but correct. Good baseline to ship immediately.
- **V2** is the best-architected implementation: clean library/component separation, multi-format support, live preview, and good UX patterns. The issues (silent PDF failure, hardcoded USD label, CSV injection) are all fixable in a small follow-up.
- **V3** is a high-fidelity UI prototype. The cloud integrations, scheduled exports, and share links are non-functional. Shipping V3 as-is would mislead users. It has value as a design spec for future cloud features but is not production-ready.

**Suggested path**: ship V2 with the following fixes before merge:
1. Show an error message when the PDF popup is blocked.
2. Derive the CSV "Amount" column header from the active currency setting.
3. Sanitize string fields for CSV formula injection (prepend `'` on fields starting with `=`, `+`, `-`, `@`).
4. Sanitize the filename input (strip characters illegal in filenames).
5. Fix the behavioral change: seed the export modal's initial filter state from the page's current active filters.
