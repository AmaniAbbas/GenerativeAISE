Add a new expense category to the SpendSmart app: $ARGUMENTS

$ARGUMENTS format: `<CategoryName> <emoji> <hexColor>`
Example: `Travel ✈️ #06b6d4`

All three arguments are required. If any are missing, ask the user before proceeding.

## Step 1 — Validate the inputs
- **CategoryName**: PascalCase, no spaces (e.g. `SideHustle` not `Side Hustle`)
- **emoji**: a single emoji character
- **hexColor**: a valid 6-digit hex color (e.g. `#06b6d4`). Derive a light `bgColor` by using the same hue at ~90% lightness — describe it as a Tailwind-equivalent (e.g. `#cffafe` for cyan-100).
- **tailwindColor**: pick the closest Tailwind text color class for the hex (e.g. `text-cyan-500`)

If the CategoryName already exists in `lib/types.ts`, stop and tell the user.

## Step 2 — Update `expense-tracker-ai/lib/types.ts`
Add the new category to the `Category` union type:
```ts
type Category =
  | "Food"
  | ...
  | "<CategoryName>";  // ← add here
```

## Step 3 — Update `expense-tracker-ai/lib/constants.ts`
Add to the `CATEGORIES` array:
```ts
export const CATEGORIES: Category[] = [
  ...,
  "<CategoryName>",
];
```

Add to `CATEGORY_CONFIG`:
```ts
<CategoryName>: {
  color: "<hexColor>",
  bgColor: "<derivedBgColor>",
  icon: "<emoji>",
  tailwindColor: "<tailwindColor>",
},
```

## Step 4 — Verify
Run `npx tsc --noEmit`. The TypeScript compiler will surface any exhaustive switch/map that needs updating. Fix every type error before finishing.

## Step 5 — Summarise
Report:
- The three files changed
- The full CATEGORY_CONFIG entry that was added
- Any components that needed updating due to type errors
- A reminder to re-seed demo data if the user wants sample expenses in the new category
