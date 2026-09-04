#!/usr/bin/env node
// Scaffolds the reports/ research store. Idempotent: never overwrites an
// existing file, never touches folders it didn't create.
// Usage: node scaffold.mjs [project-root]

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const reports = path.join(root, "reports");

const DIRS = ["research"];

const README = `# reports/

The project's **research store** — where delegated web research and
context-gathering output lands so a future session reads it back instead of
searching the internet again. Created by the \`reports-architecture\` skill.

| Folder | Contents | Written by |
|---|---|---|
| \`research/\` | Dated research reports, \`YYYY-MM-DD_<slug>.md\` | the \`research\` skill (\`/research\`) |

That is the entire architecture. This folder is not a working record.

## What does *not* go here

- **Durable facts and notes** → the second brain vault.
- **Decisions that are expensive to reverse** → \`docs/decisions/\` (\`adr\` skill).
- **Open work, session logs, compaction checkpoints** → the vault; PreCompact
  dumps land in \`.claude/precompact/\` and are gitignored.

## Rules

- One file per research run. Sources linked inline, dates next to anything perishable.
- Reports are **immutable** — a report is what was believed on that date. A
  correction is a newer report that references the old one, never an edit.

---

## Snippet to add to CLAUDE.md

\`\`\`markdown
## Research

Web research and context-gathering output goes to \`reports/research/\` as
\`YYYY-MM-DD_<slug>.md\` (the \`research\` skill). Read what's already there before
researching a topic again. Reports are immutable — correct one by writing a
newer report that references it.
\`\`\`
`;

const KEEP = {
  research: "Research reports. Naming: `YYYY-MM-DD_<slug>.md`. Always include source links.",
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
write(path.join(reports, ".reports-architecture"), `v2 research-store\ncreated: ${new Date().toISOString()}\n`);
write(path.join(reports, "README.md"), README);

console.log(`reports/ research store ready → ${reports}`);
console.log(`  created: ${created} file(s), skipped (already present): ${skipped}`);
