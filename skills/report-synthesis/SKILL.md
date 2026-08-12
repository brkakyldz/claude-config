---
name: report-synthesis
description: Reads the unsynthesized agent reports under reports/agents/, reduces them to a single orchestrator synthesis, flags contradictions, and moves open items to the backlog. Use when the user says "synthesize the reports", "pull the agent output together", "summarize what came back", or whenever synthesis/_PENDING.md exists.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# Synthesize agent reports

The orchestrator layer. Reduces raw agent findings into one document someone can
actually decide from.

## Steps

1. **Determine scope.** Find the newest file in `reports/synthesis/`. Take every
   report in `reports/agents/` **newer** than it. If no synthesis exists yet, take
   all of them. If `reports/synthesis/_PENDING.md` exists, the list is already there.

2. **Read them in full.** Don't skim — contradictions hide in the body, not the
   frontmatter.

3. **Weight them.** Reports tagged `confidence: low` or `source: hook(SubagentStop)`
   are weaker evidence. A finding from a `status: partial` report does not carry the
   same weight as one from a completed report.

4. **Resolve or flag contradictions.** When two agents disagree: if you can settle
   it by looking at the actual files, do so and record how. If you can't, **leave the
   contradiction standing** — a fabricated consensus is the most dangerous output
   this layer can produce.

5. **Write the synthesis** → `reports/synthesis/YYYY-MM-DD_synthesis.md`.

6. **Move open items.** Collect every `open_items` entry into one file under
   `reports/backlog/`, or append to the existing one.

7. **Delete `_PENDING.md`.** Once the synthesis is written, remove
   `reports/synthesis/_PENDING.md` — the `Stop` hook rewrites it if needed.

## Template

```markdown
---
date: 2026-08-12T16:00:00.000Z
kind: synthesis
sources: 4          # number of agent reports synthesized
conflicts: 1        # unresolved contradictions
open_items: 3
---

## Decisions

Three to five items the orchestrator or a human can act on. Decisions, not findings.

## Where the reports agree

- Finding — source: `agents/2026-08-12_explorer_14-03-55Z.md`

## Contradictions

| Topic | Agent A | Agent B | Status |
|---|---|---|---|
| ... | ... | ... | resolved (how) / **open** |

## Still unanswered

Which questions remain open, and what it would take to answer them.

## Open items → backlog

- [ ] ... (moved into `backlog/<file>.md`)
```

## Rules

- A synthesis is **short**. Turning four reports into four reports' worth of text
  is copying, not synthesis. Target roughly 25% of the input.
- Every agreed finding carries its **source filename** — traceability is the entire
  purpose of this architecture.
- If the synthesis leads to a decision that is expensive to reverse, also record it
  with the `adr` skill under `reports/decisions/`. A synthesis is transient; an ADR
  is permanent.
- **Never delete or edit agent reports.** Synthesis is a separate layer.
