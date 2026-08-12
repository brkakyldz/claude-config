// Stop — flag agent reports that have not been synthesized yet.
//
// Rationale: "the Stop hook produces a synthesis draft at the end of a session."
// DELIBERATE DESIGN: this hook never exits 2 and never blocks the session —
// making a Stop hook blocking risks an infinite loop. Instead it maintains the
// synthesis/_PENDING.md marker, which the SessionStart hook already surfaces at
// the beginning of the next session.

import fs from "node:fs";
import path from "node:path";
import { readInput, safe, findReportsRoot, ensureDir, filesByMtime } from "./lib.mjs";

safe(async () => {
  const input = await readInput();
  if (input.stop_hook_active) return; // seatbelt
  const root = findReportsRoot(input.cwd);
  if (!root) return;

  const synthDir = path.join(root, "synthesis");
  if (!ensureDir(synthDir)) return;

  const agents = filesByMtime(path.join(root, "agents"));
  const lastSynth = filesByMtime(synthDir)[0];
  const pending = lastSynth ? agents.filter((a) => a.mtime > lastSynth.mtime) : agents;

  const marker = path.join(synthDir, "_PENDING.md");
  if (!pending.length) {
    try { fs.unlinkSync(marker); } catch { /* already gone */ }
    return;
  }

  const body = [
    "---",
    `updated: ${new Date().toISOString()}`,
    `pending: ${pending.length}`,
    "---",
    "",
    "# Agent reports awaiting synthesis",
    "",
    lastSynth ? `Latest synthesis: \`${lastSynth.name}\`` : "No synthesis has been written yet.",
    "",
    ...pending.map((p) => `- [ ] \`agents/${p.name}\``),
    "",
    "Running the `report-synthesis` skill deletes this file automatically.",
    "",
  ].join("\n");

  fs.writeFileSync(marker, body, "utf8");
});
