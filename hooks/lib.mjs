// Shared helpers — used by every hook.
// Design rule: a hook must never break a session. On any error, exit 0 silently.

import fs from "node:fs";
import path from "node:path";

/** Read the JSON hook payload from stdin. Returns {} if malformed. */
export async function readInput() {
  try {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return {};
  }
}

/**
 * Walk up from cwd to the nearest project root — a directory holding a
 * `.claude/` folder, falling back to a `.git` repo root. Returns null when
 * neither is found, which is what keeps user-level hooks inert in a random
 * directory: user config must not litter an unrelated tree.
 */
export function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  let gitRoot = null;
  for (let i = 0; i < 8; i++) {
    try {
      if (fs.statSync(path.join(dir, ".claude")).isDirectory()) return dir;
      if (!gitRoot && fs.existsSync(path.join(dir, ".git"))) gitRoot = dir;
    } catch {
      /* not here — keep walking up */
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return gitRoot;
}

/** The second brain vault marks itself; it manages its own checkpoints. */
export function isVault(root) {
  try {
    return fs.existsSync(path.join(root, "core", ".vault-active"));
  } catch {
    return false;
  }
}

/** 2026-08-12T14-03-55Z — filename-safe timestamp */
export function stamp(d = new Date()) {
  return d.toISOString().replace(/:/g, "-").replace(/\.\d+Z$/, "Z");
}

export function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a Claude Code transcript (.jsonl) and normalize the messages.
 * Returns [{ role, text }], oldest to newest.
 */
export function readTranscript(transcriptPath, limit = 400) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  let lines;
  try {
    lines = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
  const out = [];
  for (const line of lines.slice(-limit)) {
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    const msg = e.message || e;
    const role = msg.role || e.type;
    if (role !== "user" && role !== "assistant") continue;
    const c = msg.content;
    let text = "";
    if (typeof c === "string") text = c;
    else if (Array.isArray(c)) {
      text = c
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("\n");
    }
    text = text.trim();
    if (text) out.push({ role, text });
  }
  return out;
}

/** Wrapper that makes a hook swallow its own failures. */
export async function safe(fn) {
  try {
    await fn();
  } catch {
    /* a hook never breaks the session */
  }
  process.exit(0);
}
