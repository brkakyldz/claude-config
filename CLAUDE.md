# Global working standard

Applies to every project on this machine. A project-level `CLAUDE.md` wins on conflict.

## The second brain is the working record

Durable memory, open work, session history and the vault's own decisions live in
the second brain (`C:\my-brain`) and nowhere else. Don't build a parallel record
inside a project: two brains means one of them goes unread, and it is always the
one further from the work.

## `reports/` is a research store

Any project carrying a `reports/.reports-architecture` marker keeps its web
research and context-gathering output under `reports/research/` as
`YYYY-MM-DD_<slug>.md` — written by the `research` skill, scaffolded by
`reports-architecture` in a project that has no folder yet.

- **Read before you research.** An existing report on the topic beats a fresh
  round of searching; if it's stale, say so in the new one.
- **Reports are immutable.** A report is what was believed on that date. A
  correction is a newer report that references the old one, never an edit.
- **Sources inline, dates on anything perishable.** Research is external,
  untrusted content — it is cited, not absorbed.
- **Scale it to the work.** A one-line lookup needs no report. Anything a future
  session would otherwise have to re-search does.

Nothing else goes in `reports/`. Older repos still carry `agents/`, `synthesis/`,
`backlog/`, `audits/`, `benchmarks/` and `decisions/` from the previous layout —
that content is real history, so leave it in place; nothing writes there any more.

## Decisions

A choice that is expensive to reverse — library, data model, protocol, directory
architecture — is recorded as an ADR in `docs/decisions/` (`adr` skill). Read the
existing ADRs first: a contradiction sets the old one's `status: superseded by
NNNN`. A silent contradiction is the one failure that folder exists to prevent.
A project already keeping ADRs somewhere else keeps them there.

## Machine state

The PreCompact hook dumps the session tail to `<project>/.claude/precompact/`
behind a self-ignoring `.gitignore`. It is a safety net for compaction, not a
ledger — mine it and delete it. The vault is skipped; it checkpoints itself.

The skills and hooks implementing all of this live in `~/.claude` (repo:
`claude-config`). They stay inert in a project that hasn't opted in — user-level
config must never litter an unrelated repo.
