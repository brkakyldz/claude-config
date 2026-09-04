// End-to-end test for the PreCompact hook and the reports/ research scaffold.
// Run: node hooks/tests/precompact-hook.test.mjs
//
// Builds throwaway projects in the OS temp dir and asserts that the hook writes
// its dump into .claude/precompact/, stays out of the tracked tree, skips the
// vault, and stays silent in a directory that is not a project at all.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOOKS = path.join(HERE, "..");
const SCAFFOLD = path.join(HERE, "..", "..", "skills", "reports-architecture", "scripts", "scaffold.mjs");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "precompact-hook-"));
const PROJECT = path.join(TMP, "project");
const VAULT = path.join(TMP, "vault");
const BARE = path.join(TMP, "bare");
const TX = path.join(TMP, "transcript.jsonl");

let failed = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
};

const call = (hook, input) =>
  execFileSync("node", [path.join(HOOKS, hook)], { input: JSON.stringify(input), encoding: "utf8" });

const ls = (dir) => {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md");
  } catch {
    return [];
  }
};

// --- fixtures ---------------------------------------------------------------
fs.mkdirSync(path.join(PROJECT, ".claude"), { recursive: true });
fs.mkdirSync(path.join(VAULT, ".claude"), { recursive: true });
fs.mkdirSync(path.join(VAULT, "core"), { recursive: true });
fs.writeFileSync(path.join(VAULT, "core", ".vault-active"), "1\n");
fs.mkdirSync(BARE, { recursive: true });

fs.writeFileSync(
  TX,
  [
    { type: "user", message: { role: "user", content: "Compare arq and dramatiq" } },
    { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "arq is asyncio-native." }] } },
  ]
    .map((e) => JSON.stringify(e))
    .join("\n") + "\n"
);

const payload = (cwd) => ({
  cwd,
  session_id: "test-session",
  transcript_path: TX,
  trigger: "manual",
});

// --- 1. scaffold ------------------------------------------------------------
console.log("\nreports/ research scaffold");
execFileSync("node", [SCAFFOLD, PROJECT], { encoding: "utf8" });
const R = path.join(PROJECT, "reports");
check("marker written", fs.existsSync(path.join(R, ".reports-architecture")));
check("research/ created", fs.existsSync(path.join(R, "research")));
check(
  "no working-record folders",
  !["agents", "synthesis", "backlog", "audits", "benchmarks", "decisions"].some((d) =>
    fs.existsSync(path.join(R, d))
  ),
  fs.readdirSync(R).join(",")
);

// --- 2. PreCompact in a project --------------------------------------------
console.log("\nPreCompact");
call("precompact-dump.mjs", payload(PROJECT));
const dumps = path.join(PROJECT, ".claude", "precompact");
check("dump written to .claude/precompact/", ls(dumps).length === 1, ls(dumps).join(","));
check("dump is gitignored", fs.readFileSync(path.join(dumps, ".gitignore"), "utf8").trim() === "*");
check("nothing written into reports/", ls(path.join(R, "research")).length === 0);
const body = fs.readFileSync(path.join(dumps, ls(dumps)[0]), "utf8");
check("transcript tail captured", body.includes("arq is asyncio-native."));

// --- 3. the vault is skipped ------------------------------------------------
call("precompact-dump.mjs", payload(VAULT));
check("vault skipped", !fs.existsSync(path.join(VAULT, ".claude", "precompact")));

// --- 4. a non-project directory stays untouched -----------------------------
call("precompact-dump.mjs", payload(BARE));
check("bare dir untouched", fs.readdirSync(BARE).length === 0, fs.readdirSync(BARE).join(","));

console.log(`\n${failed ? `${failed} check(s) FAILED` : "all checks passed"}   (${TMP})`);
process.exit(failed ? 1 : 0);
