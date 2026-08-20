# Global working standard

Applies to every project on this machine. A project-level `CLAUDE.md` wins on conflict.

## The working record (`reports/`)

Agent output is only real once it is a file. Any project carrying a
`reports/.reports-architecture` marker follows this contract; the `reports-architecture`
skill scaffolds the layout into a project that doesn't have it yet.

- **Every delegated task writes a report** to `reports/agents/` before it is called done
  (`agent-report` skill). The `SubagentStop` hook reconstructs one when the agent forgets —
  that fallback is a safety net, not the standard.
- **Reports are reduced, not accumulated.** Once several pile up, `report-synthesis`
  collapses them into a single file under `reports/synthesis/`. A surviving
  `synthesis/_PENDING.md` is that debt, and `SessionStart` keeps surfacing it.
- **Every expensive-to-reverse decision becomes an ADR** in `reports/decisions/`
  (`adr` skill) — library, data model, protocol, directory architecture. Read the
  existing ADRs first: a contradiction sets the old one's `status: superseded by NNNN`.
  A silent contradiction is the one failure this folder exists to prevent.
- **Open work lives in `reports/backlog/`,** one file per thread, deleted when the work
  closes. `backlog/precompact_*.md` are machine-written checkpoints — mine them, then delete.
- **Reports are evidence, not memory.** They are cited by pointer and never rewritten
  after the fact: a report is what was believed on that date. A correction is a newer
  report, not an edit to an old one.
- **Scale it to the work.** A one-line question needs no report. Anything a future session
  would otherwise have to re-derive does.

The skills and hooks implementing this live in `~/.claude` (repo: `claude-config`).
Every one of them is inert in a project without the marker — user-level config must
never litter an unrelated repo.
