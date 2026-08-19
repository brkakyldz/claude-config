---
name: reports-architecture
description: Scaffolds the reports/ folder architecture (agents, synthesis, backlog, audits, benchmarks, research, decisions) into a project in one step, and supplies the CLAUDE.md reporting contract. Use when the user says "set up the reports skeleton", "add the report architecture to this project", "scaffold reports", or when starting a new agentic project.
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Scaffold the reports/ architecture

Creates the standard folder skeleton that makes agent output durable, traceable,
and transferable to an orchestrator. Governing principle: **the filesystem is
the architecture** — rely on convention, not a framework.

## Usage

```bash
node ~/.claude/skills/reports-architecture/scripts/scaffold.mjs <project-root>
```

Defaults to the current directory when no argument is given. The script is
idempotent — it never overwrites an existing file, it only fills in what's missing.

## What it creates

```
reports/
├── .reports-architecture   # marker — how the hooks recognize the architecture
├── README.md               # what each folder is for
├── agents/                 # raw per-agent reports (written by the agent-report skill)
├── synthesis/              # orchestrator syntheses (report-synthesis skill)
├── backlog/                # unfinished work, PreCompact checkpoints
├── audits/{48h,72h}/       # time-windowed audits (audit-window skill)
├── benchmarks/             # measurement / performance output
├── research/               # context and architecture research
└── decisions/              # ADRs — "why was this chosen" (adr skill)
```

## After scaffolding

1. **CLAUDE.md contract.** The script writes a ready-made snippet at the bottom of
   `reports/README.md`. Add it to the project's `CLAUDE.md`. Respect the 60-line
   target / 200-line ceiling — if the snippet makes the file too long, reference
   `@reports/README.md` instead of inlining it.

2. **`.gitignore` decision.** Default: `reports/` **is committed** — traceability is
   the whole point. If the report noise is unwanted, ignore only
   `reports/backlog/precompact_*.md`; those are machine-generated intermediates.

3. **Subagent definitions.** Add "when finished, write your report to
   `reports/agents/` in the `agent-report` format" to the definitions of agents
   that write code or do research. The `SubagentStop` hook already guarantees
   this, but a report the agent wrote itself is always better.

## When not to use this

Don't scaffold it into one-off, short-lived repos. This skeleton exists for
projects where output from multiple agents accumulates over time and has to be
read back later.
