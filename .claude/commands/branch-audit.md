Audit all branches in the SpendSmart repository and propose a cleanup plan.

## Step 1 — Gather branch data
Run the following and collect the output:
```bash
git fetch --prune
git branch -a
git log --oneline main..HEAD 2>/dev/null || true
```

For each local branch (excluding main), check:
```bash
git log main..<branch> --oneline        # commits ahead of main
git log <branch>..main --oneline        # commits behind main (i.e. merged content)
git merge-base --is-ancestor <branch> main && echo "fully merged" || echo "not merged"
```

## Step 2 — Classify every branch
Assign each branch one of these statuses:

| Status | Meaning |
|---|---|
| ✅ **Merged** | All commits are already in main — safe to delete |
| 🔄 **Open / Active** | Has commits not in main — likely in-progress or awaiting PR |
| ⚠️ **Stale** | Not merged, but last commit is older than 30 days |
| 🔀 **Integration** | Named `integration/*` — temporary merge branch, check if still needed |

## Step 3 — Check for open PRs
```bash
gh pr list --state open
gh pr list --state merged
```
Cross-reference branches with PR status. A branch with a merged PR but no deletion is a cleanup candidate.

## Step 4 — Produce the audit report
Print a table:

```
Branch                        Status        Last commit   PR
-----------------------------  ------------  ------------  ------
feature/monthly-insights       🔄 Open       2026-04-23    #4 open
feature/analytics-dashboard    ✅ Merged     2026-04-10    #2 merged
feature-data-export-v1         ✅ Merged     2026-04-08    —
...
```

Then list:
- **Safe to delete now** (merged, no open PR): `git branch -d <name>` commands ready to copy-paste
- **Review before deleting** (stale, unmerged): explain what unique work each contains
- **Keep** (open/active): list with their open PR links

## Step 5 — Ask before deleting
Do NOT delete any branches automatically. Present the plan and wait for the user to confirm which branches to clean up.

## Step 6 — Execute approved deletions
For each branch the user approves:
```bash
git branch -d <branch>           # local
git push origin --delete <branch> # remote
```
Report what was deleted and what was kept.
