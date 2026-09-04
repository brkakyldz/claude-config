---
name: reports-architecture
description: Scaffolds the reports/ research store into a project — a single place where delegated web research and context-gathering output lands as dated markdown. Use when the user says "set up reports", "scaffold the research store", "add the reports folder to this project", or before the first /research run in a repo that has no reports/ folder yet.
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Scaffold the reports/ research store

`reports/` is **a research store and nothing else**: the place where the
`research` skill's deliverables land so a future session can read them back
instead of re-searching the internet.

It used to be a whole working record — agent reports, syntheses, backlog,
audits, benchmarks. That layer is gone. Durable memory, open work and session
history now live in the second brain (`C:\my-brain`), and project decisions go
to `docs/decisions/` via the `adr` skill. Keeping a parallel record in every
repo meant maintaining two brains, and the second one never got read.

## Usage

```bash
node ~/.claude/skills/reports-architecture/scripts/scaffold.mjs <project-root>
```

Defaults to the current directory. Idempotent — it never overwrites an existing
file and never touches folders it didn't create.

## What it creates

```
reports/
├── .reports-architecture   # marker — how the research skill recognizes the store
├── README.md               # what goes here and what doesn't
└── research/               # dated research reports, YYYY-MM-DD_<slug>.md
```

That's the whole architecture. The marker filename is kept for backward
compatibility with repos scaffolded under the old layout.

## What goes in, what stays out

| Goes in `reports/research/` | Lives elsewhere |
|---|---|
| Web-research reports from `/research` | Durable facts and notes → the vault |
| Comparisons of libraries / tools / approaches | Decisions expensive to reverse → `docs/decisions/` (`adr` skill) |
| Prior-art and context gathering before a build | Open work, session logs, checkpoints → the vault |

One file per research run, `YYYY-MM-DD_<slug>.md`, with its sources linked
inline. Reports are **immutable**: a research report is what was believed on
that date. A correction is a newer report that references the old one, never an
edit to it.

## Legacy folders

Repos scaffolded before this change still carry `agents/`, `synthesis/`,
`backlog/`, `audits/`, `benchmarks/` and `decisions/`. Leave them alone — the
content is real history. Nothing writes to them any more; the scaffold won't
recreate them, and the hooks that fed them are deleted.

## When not to use this

A repo that will never have research written into it doesn't need the folder.
The `research` skill falls back to a single `research-<slug>.md` at the project
root, which is fine for one-off cases.
