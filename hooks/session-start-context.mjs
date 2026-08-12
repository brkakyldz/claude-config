// SessionStart — inject the state of reports/ into the session context.
//
// Rationale: "load context at session start". Deliberately kept SHORT (25-line
// cap) — the same discipline that keeps CLAUDE.md from bloating applies here.

import fs from "node:fs";
import path from "node:path";
import { readInput, safe, findReportsRoot, filesByMtime } from "./lib.mjs";

const MAX_LIST = 5;

function titleOf(file) {
  try {
    const head = fs.readFileSync(file, "utf8").slice(0, 2000);
    const m = head.match(/^task:\s*"?(.+?)"?\s*$/m) || head.match(/^#\s+(.+)$/m);
    return m ? m[1].slice(0, 80) : path.basename(file);
  } catch {
    return path.basename(file);
  }
}

safe(async () => {
  const input = await readInput();
  const root = findReportsRoot(input.cwd);
  if (!root) return;

  const out = [];
  const agents = filesByMtime(path.join(root, "agents"));
  const synth = filesByMtime(path.join(root, "synthesis"));
  const backlog = filesByMtime(path.join(root, "backlog"));

  const lastSynth = synth[0];
  const unsynth = lastSynth ? agents.filter((a) => a.mtime > lastSynth.mtime) : agents;

  if (backlog.length) {
    out.push(`**Open backlog (${backlog.length}):**`);
    for (const b of backlog.slice(0, MAX_LIST)) out.push(`- \`backlog/${b.name}\` — ${titleOf(b.path)}`);
  }
  if (unsynth.length) {
    out.push(`**Unsynthesized agent reports: ${unsynth.length}** (run the \`report-synthesis\` skill)`);
    for (const a of unsynth.slice(0, MAX_LIST)) out.push(`- \`agents/${a.name}\``);
  }
  if (lastSynth) out.push(`**Latest synthesis:** \`synthesis/${lastSynth.name}\``);

  if (!out.length) return; // clean state → inject nothing

  const context = [
    `## reports/ status (${path.relative(input.cwd || ".", root) || "reports"})`,
    "",
    ...out.slice(0, 25),
  ].join("\n");

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
    })
  );
});
