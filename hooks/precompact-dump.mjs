// PreCompact — dump findings to disk before the context is compacted.
//
// Rationale: intermediate findings lost during compaction are the most
// expensive kind of loss. This hook writes a short core of the session into
// reports/backlog/ before compaction; the next session surfaces it via the
// SessionStart hook.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  readInput, safe, findReportsRoot, stamp, ensureDir, readTranscript,
} from "./lib.mjs";

const TAIL = 24;        // how many trailing messages to keep
const PER_MSG = 700;    // per-message character cap

safe(async () => {
  const input = await readInput();
  const root = findReportsRoot(input.cwd);
  if (!root) return;

  const dir = path.join(root, "backlog");
  if (!ensureDir(dir)) return;

  const messages = readTranscript(input.transcript_path).slice(-TAIL);
  if (!messages.length) return;

  let branch = "";
  try {
    branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: input.cwd, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8",
    }).trim();
  } catch { /* not a git repo */ }

  const lines = [
    "---",
    `date: ${new Date().toISOString()}`,
    `session: ${input.session_id || "unknown"}`,
    `trigger: precompact/${input.trigger || "auto"}`,
    branch ? `branch: ${branch}` : "branch: (no git)",
    "status: open",
    "---",
    "",
    "# PreCompact checkpoint",
    "",
    "A slice captured immediately before the context was compacted. When you",
    "return to this work, review it with the `report-synthesis` skill; delete the",
    "items that closed, and delete this file once it is empty.",
    "",
    "## Conversation tail",
    "",
  ];

  for (const m of messages) {
    const t = m.text.length > PER_MSG ? m.text.slice(0, PER_MSG) + " …[truncated]" : m.text;
    lines.push(`### ${m.role}`, "", t, "");
  }

  fs.writeFileSync(path.join(dir, `precompact_${stamp()}.md`), lines.join("\n"), "utf8");
});
