Create a new screen in the SpendSmart expense tracker app: $ARGUMENTS

Follow these steps exactly:

## Step 1 — Create a feature branch
Create and switch to a new branch:
```
git checkout -b feature/<screen-name>
```
Use the screen name from $ARGUMENTS in kebab-case.

## Step 2 — Scaffold the page
Create `expense-tracker-ai/app/<screen-name>/page.tsx` following this exact pattern:
```tsx
"use client";

import { Header } from "@/components/layout/Header";
import { useExpenses } from "@/hooks/useExpenses";
// Import your feature component here

export default function <ScreenName>Page() {
  const { expenses, isLoaded } = useExpenses();

  return (
    <>
      <Header />
      <main className="flex-1 p-4 md:p-6 space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-bold"><Screen Title></h2>
          <p className="text-indigo-100 text-sm mt-0.5"><One-line description></p>
        </div>
        {/* Feature component goes here */}
      </main>
    </>
  );
}
```

## Step 3 — Create the component directory and main component
Create `expense-tracker-ai/components/<screen-name>/` and scaffold the primary component with:
- `"use client"` directive
- Props: `{ expenses: Expense[]; isLoaded: boolean }`
- A loading skeleton (animate-pulse blocks) rendered when `isLoaded` is false
- Correct design system: `bg-white rounded-2xl border border-slate-100 shadow-sm p-6`
- Currency formatting via `useCurrency()` and `formatCurrency()`

## Step 4 — Wire up navigation
Make two changes:

**`expense-tracker-ai/lib/constants.ts`** — add to NAV_ROUTES:
```ts
{ label: "<Screen Label>", href: "/<screen-name>" },
```

**`expense-tracker-ai/components/layout/Sidebar.tsx`** — add to NAV_ICONS:
```tsx
"/<screen-name>": (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
  </svg>
),
```
Choose an SVG icon path that semantically fits the screen's purpose.

## Step 5 — Verify
Run `npx tsc --noEmit` to confirm no type errors. Fix any before proceeding.

## Step 6 — Summarise
Report:
- Branch name created
- Files created/modified
- The route the new screen is accessible at
