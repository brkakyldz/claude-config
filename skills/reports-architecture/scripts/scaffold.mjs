#!/usr/bin/env node
// Scaffolds the reports/ skeleton. Idempotent: never overwrites an existing file.
// Usage: node scaffold.mjs [project-root]

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const reports = path.join(root, "reports");

const DIRS = [
  "agents", "synthesis", "backlog", "audits/48h", "audits/72h",
  "benchmarks", "research", "decisions",
];

const README = `# reports/

The layer where agent output becomes durable and the orchestrator reads it back
and synthesizes it. Created by the \`reports-architecture\` skill.

| Folder | Contents | Written by |
|---|---|---|
| \`agents/\` | Raw per-agent findings | subagents (\`agent-report\` skill), guaranteed by the \`SubagentStop\` hook |
| \`synthesis/\` | Orchestrator syntheses | \`report-synthesis\` skill |
| \`backlog/\` | Unfinished work, PreCompact checkpoints | humans + the \`PreCompact\` hook |
| \`audits/48h\`, \`audits/72h\` | Time-windowed audit summaries | \`audit-window\` skill |
| \`benchmarks/\` | Measurement / performance output | manual or CI |
| \`research/\` | Context and architecture research | research agents |
| \`decisions/\` | ADRs — "why this, and why not the alternatives" | \`adr\` skill |

## Lifecycle

\`\`\`
subagent → agents/*.md → report-synthesis → synthesis/*.md → audit-window → audits/48h/*.md
                ↓                                    ↑
            backlog/*.md ────── open items ──────────┘
\`\`\`

If \`synthesis/_PENDING.md\` exists, there are agent reports that have not been
synthesized yet (written by the \`Stop\` hook, deleted by \`report-synthesis\`).

---

## Snippet to add to CLAUDE.md

\`\`\`markdown
## Reporting contract

- Every delegated task writes its findings to \`reports/agents/\` when it finishes
  (format: the \`agent-report\` skill).
- Once several agent reports accumulate, \`report-synthesis\` reduces them to a
  single summary under \`reports/synthesis/\`.
- Technical decisions that are expensive to reverse are recorded as ADRs under
  \`reports/decisions/\`; a new decision reads these first and must not silently
  contradict them.
- Unfinished work stays open under \`reports/backlog/\`; delete the file when it closes.
\`\`\`
`;

const KEEP = {
  "agents": "Agent reports go here. Naming: `YYYY-MM-DD_<agent>_<time>.md`",
  "synthesis": "Orchestrator syntheses. Naming: `YYYY-MM-DD_synthesis.md`",
  "backlog": "Open work. Delete the file when it closes — an empty folder here is good news.",
  "audits/48h": "48-hour audit windows. Naming: `YYYY-MM-DD_48h.md`",
  "audits/72h": "72-hour audit windows. Naming: `YYYY-MM-DD_72h.md`",
  "benchmarks": "Measurement output. Keep the format stable so runs stay comparable.",
  "research": "Architecture / context research. Always include source links.",
  "decisions": "ADRs. Naming: `NNNN-kebab-title.md`; numbers increase and are never reused.",
};

let created = 0, skipped = 0;
function write(p, content) {
  if (fs.existsSync(p)) { skipped++; return; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
  created++;
}

for (const d of DIRS) {
  fs.mkdirSync(path.join(reports, d), { recursive: true });
  write(path.join(reports, d, "README.md"), `# ${d}\n\n${KEEP[d]}\n`);
}
write(path.join(reports, ".reports-architecture"), `v1\ncreated: ${new Date().toISOString()}\n`);
write(path.join(reports, "README.md"), README);

console.log(`reports/ ready → ${reports}`);
console.log(`  created: ${created} file(s), skipped (already present): ${skipped}`);
console.log(`\nNext step: copy the CLAUDE.md snippet at the end of reports/README.md into the project's CLAUDE.md.`);
