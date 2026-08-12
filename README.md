# claude-config

Personal Claude Code environment: skills, hooks, and settings, versioned so it
survives a machine and travels between them.

Built around one idea — **the filesystem is the architecture**. Agent output
becomes durable files in a known layout, and the orchestrator reads them back.
Convention rather than framework.

## Layout

```
.
├── settings.json         # permissions.deny + hook registrations
├── hooks/                # deterministic guarantees (Node, no dependencies)
│   ├── lib.mjs           # shared helpers; every hook fails silently by design
│   └── tests/            # runnable test suites
├── skills/               # knowledge the model loads on demand
└── statusline-command.sh
```

## Skills

| Skill | Purpose |
|---|---|
| `reports-architecture` | Scaffolds the `reports/` skeleton into a project |
| `agent-report` | The contract for a single agent's findings |
| `report-synthesis` | Reduces many agent reports to one decision document |
| `adr` | Records decisions that are expensive to reverse |
| `audit-window` | 48h/72h time-windowed audit summaries |

## Hooks

| Event | Script | What it guarantees |
|---|---|---|
| `PreToolUse` (Bash) | `guard-bash.mjs` | Blocks `rm -rf`, `sudo`, `git push --force`, `git reset --hard`, `~/.ssh`, `.env`, `curl \| sh`, `--no-verify`, and `sh -c` wrappers around them |
| `SubagentStop` | `subagent-report.mjs` | A subagent's findings always land in `reports/agents/`, even if the agent forgot |
| `PreCompact` | `precompact-dump.mjs` | Findings are dumped to `reports/backlog/` before context is compacted |
| `SessionStart` | `session-start-context.mjs` | Open backlog and unsynthesized reports are injected into context |
| `Stop` | `stop-synthesis.mjs` | Maintains the `synthesis/_PENDING.md` marker |

Design rules the hooks follow:

- **Never break a session.** Every hook wraps its work in `safe()` and exits 0 on any error.
- **Inert by default.** The four report hooks do nothing in projects without a
  `reports/.reports-architecture` marker — user-level config must not litter every repo.
- **`Stop` never blocks.** Making a Stop hook exit 2 risks an infinite loop; it writes
  a marker instead and lets `SessionStart` surface it next time.

## Tests

```bash
node hooks/tests/guard-bash.test.mjs
node hooks/tests/reports-hooks.test.mjs
```

The first covers the guard's deny list plus false-positive cases (a guard that
blocks `echo 'sudo ...'` trains you to disable it). The second scaffolds a
throwaway project in the temp dir and drives each report hook end to end.

## Using it in a project

```bash
node skills/reports-architecture/scripts/scaffold.mjs <project-root>
```

Then copy the CLAUDE.md snippet from the generated `reports/README.md` into the
project's `CLAUDE.md`. From that point the hooks take over.

## Notes

- Sandboxing (`sandbox.enabled`) is intentionally not enabled: it relies on macOS
  Seatbelt or Linux/WSL2 bubblewrap and has no Windows equivalent. Worth enabling
  if this config is used from WSL2.
- `--force-with-lease` is deliberately allowed while `--force` is blocked.
- Hooks are written in Node rather than bash + `jq`: no external dependency, and
  JSON parsing is native.
