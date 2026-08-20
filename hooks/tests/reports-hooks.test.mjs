// End-to-end test for the report hooks (SubagentStop, PreCompact, Stop, SessionStart).
// Run: node hooks/tests/reports-hooks.test.mjs
//
// Builds a throwaway project in the OS temp dir, scaffolds reports/ into it,
// drives each hook with a synthetic transcript, and asserts the resulting files.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOOKS = path.join(HERE, "..");
const SCAFFOLD = path.join(HERE, "..", "..", "skills", "reports-architecture", "scripts", "scaffold.mjs");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "reports-hooks-"));
const PROJECT = path.join(TMP, "project");
const BARE = path.join(TMP, "bare");
const R = path.join(PROJECT, "reports");
const TX = path.join(TMP, "transcript.jsonl");

let failed = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
};

const call = (hook, input) =>
  execFileSync("node", [path.join(HOOKS, hook)], { input: JSON.stringify(input), encoding: "utf8" });
const ls = (d) => {
  try {
    return fs.readdirSync(path.join(R, d)).filter((f) => f.toLowerCase() !== "readme.md");
  } catch {
    return [];
  }
};

// --- fixtures -------------------------------------------------------------
fs.mkdirSync(PROJECT, { recursive: true });
fs.mkdirSync(BARE, { recursive: true });
execFileSync("node", [SCAFFOLD, PROJECT], { stdio: "ignore" });
fs.writeFileSync(
  TX,
  [
    { message: { role: "user", content: "Review token refresh in the auth layer" } },
    { message: { role: "assistant", content: [{ type: "text", text: "Looking..." }] } },
    {
      message: {
        role: "assistant",
        content: [{ type: "text", text: "Finding: no refresh token rotation; auth/session.ts:88 reuses a single token." }],
      },
    },
  ].map(JSON.stringify).join("\n"),
  "utf8"
);

const base = { cwd: PROJECT, session_id: "sess-test", transcript_path: TX };

// --- SubagentStop ---------------------------------------------------------
console.log("SubagentStop");
call("subagent-report.mjs", { ...base, hook_event_name: "SubagentStop", agent_name: "auth-explorer" });
const reports = ls("agents");
check("writes a report when the agent wrote none", reports.length === 1, reports.join(","));
if (reports.length) {
  const body = fs.readFileSync(path.join(R, "agents", reports[0]), "utf8");
  check("frontmatter carries the agent name", /^agent: auth-explorer$/m.test(body));
  check("tagged as hook-generated", /source: hook\(SubagentStop\)/.test(body));
  check("task line taken from the first user message", /Review token refresh/.test(body));
}
call("subagent-report.mjs", { ...base, hook_event_name: "SubagentStop", agent_name: "auth-explorer" });
check("does not double-write within the freshness window", ls("agents").length === 1);
call("subagent-report.mjs", { ...base, hook_event_name: "SubagentStop" });
check("writes nothing when no agent identity is attached", ls("agents").length === 1);

// --- PreCompact -----------------------------------------------------------
console.log("PreCompact");
call("precompact-dump.mjs", { ...base, hook_event_name: "PreCompact", trigger: "auto" });
check("writes a checkpoint into backlog/", ls("backlog").length === 1, ls("backlog").join(","));

// --- Stop -----------------------------------------------------------------
console.log("Stop");
const marker = path.join(R, "synthesis", "_PENDING.md");
call("stop-synthesis.mjs", { ...base, hook_event_name: "Stop", stop_hook_active: false });
check("creates _PENDING.md when reports are unsynthesized", fs.existsSync(marker));
check("never blocks (produces no stderr contract)", true);

fs.writeFileSync(path.join(R, "synthesis", "2026-08-12_synthesis.md"), "---\nkind: synthesis\n---\n", "utf8");
call("stop-synthesis.mjs", { ...base, hook_event_name: "Stop", stop_hook_active: false });
check("removes _PENDING.md once a synthesis exists", !fs.existsSync(marker));

// --- SessionStart ---------------------------------------------------------
console.log("SessionStart");
fs.writeFileSync(path.join(R, "agents", "2026-08-13_later-agent_10-00-00Z.md"), "---\ntask: \"later work\"\n---\n", "utf8");
const out = call("session-start-context.mjs", { ...base, hook_event_name: "SessionStart", source: "startup" });
const ctx = out.trim() ? JSON.parse(out).hookSpecificOutput.additionalContext : "";
check("injects context", ctx.length > 0);
check("does not count README.md as content", !/README\.md/.test(ctx), ctx);
check("reports the backlog", /Open backlog/.test(ctx));

// --- inert outside the architecture ---------------------------------------
console.log("Inert without reports/");
for (const h of ["subagent-report.mjs", "precompact-dump.mjs", "stop-synthesis.mjs", "session-start-context.mjs"]) {
  const o = call(h, { cwd: BARE, session_id: "x", transcript_path: TX });
  check(`${h} stays silent and writes nothing`, o === "" && fs.readdirSync(BARE).length === 0);
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(failed === 0 ? "\nPASS" : `\nFAIL — ${failed} assertion(s)`);
process.exit(failed ? 1 : 0);
