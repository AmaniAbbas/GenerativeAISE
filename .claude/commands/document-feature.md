You are a technical writer. Generate complete documentation for the **$ARGUMENTS** feature in the SpendSmart expense tracker.

---

## Step 1 — Explore the codebase

Search the repo for all files related to **$ARGUMENTS**. Look in:
- `app/` — pages and API routes (`app/api/**` signals backend involvement)
- `components/` — React components
- `hooks/` — custom React hooks
- `context/` — React context providers
- `lib/` — utilities, types, constants

Also inventory all existing documentation:
- `docs/**/*.md` — previously generated feature docs
- `README.md`, `CLAUDE.md`, `AGENTS.md` — project-level docs

---

## Step 2 — Classify the feature

Based on what you found, classify the feature as one of:

- **frontend** — only components/hooks/context/lib, no `app/api/` routes
- **backend** — only `app/api/` route handlers and server-side logic
- **fullstack** — both UI code and API routes

State the classification explicitly before writing any documentation.

---

## Step 3 — Build a related-docs index

Scan every file in `docs/` and the project root markdown files. For each existing doc that is meaningfully related to **$ARGUMENTS** (shared types, overlapping UI, same data domain), note:
- The file path
- Why it is related (one sentence)

You will embed these as cross-reference links in both output files.

---

## Step 4 — Write Developer Documentation

Save to: `docs/$ARGUMENTS/developer.md`

```markdown
# $ARGUMENTS — Developer Documentation

> **Feature type:** [frontend | backend | fullstack]

## Overview
What this feature does and why it exists in the system.

## Architecture
[FRONTEND / FULLSTACK only]
Component tree and data-flow diagram (ASCII). Which components are containers vs. presentational.

[BACKEND / FULLSTACK only]
Request lifecycle: client → route handler → data layer → response.

## Data Model
Relevant TypeScript types verbatim from source. If none exist yet, propose them.

## API Reference
[BACKEND / FULLSTACK only]
For every route handler:
| Method | Path | Auth required | Request body | Response |
|--------|------|---------------|--------------|----------|

[FRONTEND / FULLSTACK only]
For every hook or context value:
**`useXxx(params)`** → `ReturnType`
- params: ...
- returns: ...
- side effects: ...

## State Management
How state is held (useState, context, localStorage, server state). Diagram if non-trivial.

## Key Implementation Notes
Non-obvious constraints, workarounds, or invariants a future dev must know.

## File Map
| File | Purpose |
|------|---------|

## Dependencies
Internal modules and external packages this feature relies on.

## Related Documentation
[Auto-generated from Step 3 — link every related doc with a one-sentence reason]

## Testing Checklist
- [ ] ...
```

---

## Step 5 — Write User Documentation

Save to: `docs/$ARGUMENTS/user-guide.md`

```markdown
# $ARGUMENTS — User Guide

## What is this?
One plain-language paragraph.

[BACKEND / API-only features: skip Steps section, replace with "How it works behind the scenes" prose.]

## Before you start
Any prerequisites (login required, data needed, etc.). Omit section if none.

## How to use $ARGUMENTS

### Step 1: [Verb + object]
What to do and what to expect.

[SCREENSHOT: Precise description — include element names, visible text, and UI state.
Example: "Header bar with currency selector dropdown open, showing USD and GBP options, USD currently checked"]

### Step 2: ...
[Continue for every meaningful user action]

## Tips
- ...

## Troubleshooting
| Problem | Likely cause | Fix |
|---------|-------------|-----|

## FAQ
**Q: ...**
A: ...

## Related Documentation
[Auto-generated from Step 3 — link every related doc with a one-sentence reason]
```

---

## Rules

- Never leave a section blank because you "couldn't find information" — if the feature is new and has no code yet, mark sections `_Not yet implemented_` and write what they *should* contain once built.
- Screenshot placeholders must name specific UI elements, data values, and interaction state — never write `[SCREENSHOT]` alone.
- Omit backend-only sections (API Reference table, request lifecycle) from frontend docs, and omit UI-only sections (component tree, step-by-step UI guide) from pure backend docs.
- Cross-reference links must use relative markdown paths from the output file's location (e.g. `../currency/developer.md`).
- Create the `docs/$ARGUMENTS/` directory if it does not exist.
- After saving both files, print a one-line summary: feature type detected, files written, related docs linked.
