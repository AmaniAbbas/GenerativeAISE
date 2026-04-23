@AGENTS.md

# SpendSmart — Claude Code Institutional Context

SpendSmart is a personal expense tracker built with Next.js App Router. All data lives in `localStorage`; there is no backend. The app is a Coursera Generative AI SE specialization project — features are explored and compared rather than deployed.

---

## Operational Processes

### Every feature starts with a branch
Before writing a single line of code, create a feature branch:
```bash
git checkout -b feature/<name>
```
Never work directly on `main`. If the user does not mention a branch, create one automatically.

### Parallel features use worktrees
When building two or more independent features simultaneously, use the `/parallel-work` command. It creates isolated git worktrees at `../expense-tracker-<name>` so branches never interfere. Merge them afterward with `/integrate-parallel-work`.

### Commit and PR on completion
After finishing a feature:
1. Stage only the relevant files (no `git add -A`)
2. Commit with a concise message describing *why*, not *what*
3. Push with `-u origin feature/<name>`
4. Open a PR — use `gh pr create` with a summary and test plan checklist

### Document on request
Use `/document-feature <name>` to generate developer + user docs in `docs/<name>/`. Never create docs unless asked.

---

## Naming and Standards

### Files and folders
- Pages: `app/<route>/page.tsx`
- Feature components: `components/<feature-domain>/<ComponentName>.tsx`
- Hooks: `hooks/use<Name>.ts`
- Utilities: `lib/<name>.ts`
- New routes must be added to `NAV_ROUTES` in `lib/constants.ts` and given an SVG icon in `NAV_ICONS` in `components/layout/Sidebar.tsx`

### TypeScript
- All new types go in `lib/types.ts`
- Constants and config go in `lib/constants.ts`
- Never use `any`; use the existing `Category`, `Expense`, `Currency` types

### Component conventions
- Every interactive component must have `"use client"` at the top
- All chart/data components accept `{ expenses: Expense[]; isLoaded: boolean }` props
- Render a skeleton (`animate-pulse` blocks) when `isLoaded` is false — never show empty or broken UI while loading

---

## Design System

All styling is Tailwind CSS v4. Never introduce inline styles unless overriding a dynamic value (e.g. `backgroundColor` from `CATEGORY_CONFIG`).

### Color palette
| Role | Token |
|---|---|
| Page background | `bg-slate-50` |
| Cards | `bg-white border border-slate-100 shadow-sm rounded-2xl` |
| Page banners | `bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl` |
| Sidebar | `bg-slate-900` |
| Primary action | `bg-indigo-600 hover:bg-indigo-700` |
| Secondary text | `text-slate-400` |
| Active nav item | `bg-indigo-600 text-white shadow-md shadow-indigo-900/50` |

### Category colors
Always use `CATEGORY_CONFIG[category].color` and `.bgColor`. Never hardcode hex values for categories or invent new category colors.

### Typography
- Headings: `font-bold text-slate-900`
- Body: `text-sm text-slate-600`
- Labels / captions: `text-xs text-slate-400`

### Spacing
- Card padding: `p-5` or `p-6`
- Section gaps: `space-y-5` or `gap-5`
- Border radius: `rounded-2xl` (cards), `rounded-xl` (inner elements)

### Page layout pattern
Every page follows this structure:
```tsx
<>
  <Header />
  <main className="flex-1 p-4 md:p-6 space-y-5">
    {/* Gradient banner */}
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
      <h2 className="text-lg font-bold">Page Title</h2>
      <p className="text-indigo-100 text-sm mt-0.5">Subtitle</p>
    </div>
    {/* Content */}
  </main>
</>
```

---

## Tools and Dependencies

| Purpose | Library |
|---|---|
| Charts | Recharts (`PieChart`, `BarChart`, `AreaChart`, `ResponsiveContainer`) |
| PDF export | jspdf + jspdf-autotable |
| Date helpers | date-fns |
| State | `useExpenses()` hook — reads/writes `localStorage` |
| Currency | `useCurrency()` context — USD or GBP |
| Formatting | `formatCurrency(amount, currency)` from `lib/utils.ts` |

**Do not introduce new dependencies** without a clear reason. Check if existing libraries cover the need first.

### Key utility functions (`lib/utils.ts`)
- `getCurrentMonthExpenses(expenses)` — current month filter
- `getCategorySummaries(expenses)` — sorted by total, includes percentage
- `getMonthlySummaries(expenses)` — last 6 months
- `getTotalAmount(expenses)` — sum
- `formatCurrency(amount, currency)` — Intl.NumberFormat
- `formatDate(dateStr)` — "Jan 15, 2025"

---

## Expectations and Boundaries

### Faithfully implement mockups
When the user provides a sketch or mockup, implement it precisely — layout, sections, and component structure must mirror what is shown. Don't substitute or simplify unless there is a technical reason.

### No over-engineering
- Build exactly what is asked. No extra abstractions, no future-proofing, no bonus features.
- A component over ~300 lines is a signal to split it.
- No comments unless the *why* is non-obvious to a future reader.

### No new nav items without updating both files
Adding a route always requires two changes: `NAV_ROUTES` in `lib/constants.ts` **and** `NAV_ICONS` in `components/layout/Sidebar.tsx`. Missing either will break the sidebar or the header title.

### Read the Next.js docs before writing page/routing code
This project uses Next.js 16 with breaking changes from earlier versions. Before writing any App Router code (layouts, pages, route handlers), read the relevant guide in `node_modules/next/dist/docs/01-app/`.
