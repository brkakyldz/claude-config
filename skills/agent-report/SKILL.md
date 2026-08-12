---
name: agent-report
description: Writes an agent's or subagent's findings to reports/agents/ as a markdown report with standard frontmatter. Use when a delegated research, review, or exploration task finishes and the result needs to persist, or when the user says "write this up as a report" or "record the finding".
allowed-tools: Read, Write, Glob, Bash
---

# Write an agent report

This is the single contract for every file under `reports/agents/`. Synthesis,
audits, and the `SessionStart` hook all parse this frontmatter, so **the field
names do not change**.

## Filename

```
reports/agents/YYYY-MM-DD_<agent-name>_HH-MM-SSZ.md
```

Agent name in kebab-case. The same agent may write several times a day — the
time stamp prevents collisions.

## Template

```markdown
---
agent: kebab-case-agent-name
task: "One-line description of the task"
date: 2026-08-12T14:03:55.000Z
session: <session-id or unknown>
status: complete | partial | blocked
confidence: high | medium | low
open_items: 0
---

## Summary

Three sentences maximum. The orchestrator should be able to act on this alone.

## Findings

- Concrete and verifiable. When a file is involved, use `path/to/file.ts:42`.
- Numbers where there are numbers. Not "it got faster" — "820ms → 340ms".

## Open items

- [ ] Work that could not be completed. If there is none, write "None" — don't
      delete the section.

## Sources

- Files read, commands run, URLs consulted.
```

## Field rules

| Field | Rule |
|---|---|
| `status` | `complete` only if **all** of the task is done. If any part is missing, `partial`. |
| `confidence` | Don't write `high` when an inference is unverified. Honesty here determines the quality of every synthesis downstream. |
| `open_items` | The number of checkboxes under "Open items". `report-synthesis` sums these. |

## Critical rules

- **Report what you did not find.** A failed search is a finding: "searched for X,
  not present". The synthesis layer needs to know this.
- **`status: partial` is not a failure.** A false `complete` poisons the synthesis
  and every decision derived from it.
- If `open_items > 0`, also copy those items into a file under `reports/backlog/` —
  backlog tracks closure, while an agent report is an immutable record.
- Reports are **immutable**. If one turns out to be wrong, don't edit it; write a
  new report that references the old one.

## Relationship to the hooks

The `SubagentStop` hook is the fallback for this skill: if no report was written,
it reconstructs a draft from the transcript and tags it `source: hook(SubagentStop)`.
Reports carrying that tag are treated as lower quality — using the skill is always
preferable.
