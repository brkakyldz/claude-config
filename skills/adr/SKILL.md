---
name: adr
description: Records an architecture decision as an ADR under reports/decisions/ and checks it against the existing ADRs for contradictions. Use when a technical choice that is expensive to reverse is made (library, data model, protocol, directory architecture), or when the user says "record this decision" or "write down why we chose this".
allowed-tools: Read, Write, Glob, Grep
---

# Write an ADR

The practical form of the context-engineering recommendation: keeping decisions
like *"why event sourcing and not CRUD"* in writing is what stops future agents
and humans from contradicting the past.

## Read first, then write

**Scan** the existing ADRs under `reports/decisions/`. If the new decision
contradicts an earlier one, writing a new ADR is not enough — set the old ADR's
`status` to `superseded by NNNN`. Never leave the contradiction silent; internal
consistency is the only thing that makes this folder worth anything.

## Filename

```
reports/decisions/NNNN-kebab-case-title.md
```

`NNNN` is four digits, increasing, and **never reused** (a deleted ADR leaves its
number vacant).

## Template

```markdown
---
id: 0007
title: Plain markdown for the reports layer, not a database
date: 2026-08-12
status: accepted        # proposed | accepted | superseded by 0012 | deprecated
deciders: [brkakyldz]
supersedes: []
---

## Context

What made this decision necessary. The constraints as they stood at the time —
this is what keeps the decision from looking "wrong" later when they change.

## Decision

One sentence, imperative: "The reports layer is stored as plain markdown in git."

## Rationale

Why this, and **why not the alternatives**. An ADR with this section empty is worthless.

## Alternatives considered

| Alternative | Why not |
|---|---|
| SQLite + FTS | Unreadable in a git diff, extra dependency |

## Consequences

- **Upside:** ...
- **Cost:** ... (every real decision has a cost; if there isn't one, it's a preference, not a decision)
- **Cost to reverse:** low / medium / high
```

## Rules

- **When not to write one:** for things that are cheap to undo — a variable name, a
  formatting preference, a throwaway script. A bloated decisions folder goes unread,
  and that is the biggest risk in this architecture.
- **When you must:** data models, external dependency choices, protocols and schemas,
  directory architecture, security boundaries — anything expensive to reverse.
- ADRs are **never deleted**. If one turns out to be wrong, mark it
  `status: superseded by NNNN`; the record of a wrong decision is context too.
- `status: proposed` is a real state — if a decision is still contested, leave it
  there rather than writing `accepted` and moving on.
