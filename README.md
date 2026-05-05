# SpendSmart — AI-Assisted Expense Tracker

A personal expense tracker built with Next.js and developed end-to-end using Claude Code as an AI pair programmer. This repository demonstrates applied Generative AI software engineering workflows: parallel feature development with git worktrees, custom Claude slash commands as reusable AI-powered procedures, and structured A/B comparison of AI-generated implementations.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · localStorage (no backend)

---

## App Features

The app is a fully functional, client-side expense tracker accessible at `expense-tracker-ai/`.

| Route | Description |
|---|---|
| `/` | Dashboard — spending summary, recent transactions, quick-add form |
| `/expenses` | Full expense list with filtering and search |
| `/analytics` | Category breakdowns (pie/bar charts), spending trends (area chart) |
| `/monthly-insights` | Month-over-month comparison, donut chart, budget streak tracker |

Additional capabilities across all views: multi-currency support (USD / GBP), CSV and PDF export, loading skeletons, and a responsive sidebar + mobile header layout.

---

## AI Engineering Workflows

### 1. Custom Claude Slash Commands

Six reusable slash commands live in `.claude/commands/` and encode repeatable engineering procedures. Each command is a Markdown prompt template that Claude Code executes on demand — effectively turning common dev tasks into one-liners.

| Command | What it does |
|---|---|
| `/new-screen` | Scaffolds a full Next.js page + component directory + nav wiring from a screen name |
| `/add-category` | Adds a typed expense category end-to-end: `types.ts`, `constants.ts`, and all downstream type errors |
| `/parallel-work` | Sets up isolated git worktrees for simultaneous feature development |
| `/integrate-parallel-work` | Merges worktree branches into an integration branch and resolves conflicts |
| `/branch-audit` | Classifies every branch (merged / active / stale), cross-references open PRs, generates a cleanup plan |
| `/document-feature` | Generates structured developer + user docs in `docs/<feature>/` |

Commands are version-controlled, composable, and environment-agnostic — any engineer on the project can run them without knowing the underlying implementation details.

### 2. Parallel Development with Git Worktrees

The `analytics` and `data export` features were developed simultaneously using git worktrees — each feature on its own branch, in its own directory, with no shared working tree. This lets Claude Code (or a human) work on multiple independent changes without stashing, context-switching, or branch pollution.

**Workflow used:**

```
/parallel-work analytics-dashboard, export-data
# → creates ../expense-tracker-analytics and ../expense-tracker-export-data
# → each worktree is an isolated checkout of its feature branch

# ... develop both features independently ...

/integrate-parallel-work analytics-dashboard, export-data
# → creates integration/export-analytics, merges both branches, resolves conflicts
# → merges to main after verification
```

This pattern directly mirrors how large teams manage feature isolation, and demonstrates that AI agents can be orchestrated in parallel across independent workspaces.

### 3. A/B Testing AI-Generated Implementations

The `data export` feature was deliberately built three ways — each on its own branch and open PR — to compare how an AI assistant approaches the same problem at different complexity targets.

| Version | Branch | Approach | LOC Added |
|---|---|---|---|
| **V1** | `feature-data-export-v1` | Single CSV download button wired into the existing dashboard | ~22 |
| **V2** | `feature-data-export-v2` | Modal with multi-format (CSV / JSON / PDF) and date-range filtering | ~700 |
| **V3** | `feature-data-export-v3` | Full `/export` hub: Templates, Cloud Integrations, Scheduler, History, Share | ~1,400 |

All three PRs remain open for side-by-side inspection. A detailed cross-branch analysis — architecture diagrams, trade-offs, and a recommendation — lives in [`expense-tracker-ai/code-analysis.md`](./expense-tracker-ai/code-analysis.md).

This exercise shows how to use an AI coding assistant not just to ship code, but to rapidly prototype a design space and make informed product decisions.

---

## Repository Layout

```
expense-tracker-ai/           # Next.js app
  app/                        # App Router pages
  components/                 # Feature + layout + UI components
  hooks/                      # useExpenses (localStorage), custom hooks
  context/                    # CurrencyContext
  lib/                        # types.ts, constants.ts, utils.ts, export.ts
  CLAUDE.md                   # Institutional context for Claude Code
  AGENTS.md                   # Agent-specific rules (Next.js version guardrails)
  code-analysis.md            # Cross-branch export feature comparison

.claude/commands/             # Custom slash commands (AI-powered procedures)
  new-screen.md
  add-category.md
  parallel-work.md
  integrate-parallel-work.md
  branch-audit.md
  document-feature.md
```

---

## Key Design Decisions

**`CLAUDE.md` as living architecture doc.** Every naming convention, design token, and operational process is encoded in `CLAUDE.md` so Claude Code has authoritative project context in every session. This eliminates repeated prompting and keeps AI-generated code consistent with the existing codebase.

**Commands over one-off prompts.** Instead of re-explaining scaffolding steps each time, procedures are written once as slash commands. The command is the single source of truth for how a task should be done — both for the AI and for human contributors.

**Worktrees over stashes.** Parallel features use isolated worktrees rather than stashing or temporary commits. This keeps branches clean, avoids context pollution, and mirrors how CI/CD systems handle concurrent work.

---

## Context

Built as part of the [Generative AI Software Engineering Specialization](https://www.coursera.org/specializations/generative-ai-software-engineering) on Coursera. The emphasis throughout was on engineering *process* — how to use AI tools systematically rather than ad hoc — rather than on any specific application feature.
