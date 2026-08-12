---
name: audit-window
description: Scans the agent reports, syntheses, and decisions from the last 48 or 72 hours and writes a time-windowed audit summary under reports/audits/. Use when the user says "run the 48h audit", "what happened in the last 72 hours", "run an audit", or when a scheduled task triggers it.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# Time-windowed audit

Different from synthesis: synthesis groups by **topic**, an audit groups by
**time**. The question it answers is "what happened in this window, what landed,
what broke".

Note: 48h/72h is not an official standard. These windows come from two practical
needs — (1) a reasonable interval for a human to review accumulated agent output,
and (2) being able to answer "what happened in this window" for security and
compliance purposes.

## Steps

1. **Pick the window:** `48h` or `72h`. Default to 48h if unspecified.

2. **Collect the files.** Everything that changed inside the window:

```bash
find reports -name '*.md' -newermt '48 hours ago' -not -path '*/audits/*'
```

If `find` is unavailable (Windows), do the same with `Glob` plus file timestamps.

3. **Categorize:** new agent reports / new syntheses / new ADRs / backlog items
   opened and closed / benchmark movement.

4. **Answer the audit questions** (template below).

5. **Write it** → `reports/audits/48h/YYYY-MM-DD_48h.md`

## Template

```markdown
---
window: 48h
from: 2026-08-10T09:00:00.000Z
to: 2026-08-12T09:00:00.000Z
kind: audit
agent_reports: 6
syntheses: 1
adrs: 0
backlog_opened: 3
backlog_closed: 1
---

## Window summary

Two to four sentences on where the work moved during this window.

## Produced

| Type | Count | Files |
|---|---|---|
| Agent report | 6 | `agents/...` |

## Audit questions

- **Any unsynthesized reports left?** ... (and if so, why)
- **Did the `status: partial` items close?** What happened to what was left hanging
  in the previous window?
- **Is the backlog growing or shrinking?** Opened vs closed.
- **Was any expensive-to-reverse decision made without an ADR?** — the most
  important question here.
- **What share of reports are automated (`source: hook`)?** A high share means agents
  aren't using the `agent-report` skill; fix the subagent definitions.

## Regressions in this window

What broke or went backwards. Write "None" if nothing did.

## Carried into the next window

- [ ] ...
```

## Rules

- An audit **never modifies its source files** — it only reads and summarizes.
- If the window is empty, still write the file ("no activity in this window"). The
  record of a gap is data; a missing file leaves you unable to tell "forgotten" from
  "nothing happened".
- An audit summary is not an agent report — do not write it into `reports/agents/`.
- Automation: running this skill on a scheduled task every 48 hours is the
  acceptance criterion for the final phase of the rollout plan.
