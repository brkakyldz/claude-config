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
 * Walk up from cwd to locate the reports/ architecture.
 * Prefers the marker file (reports/.reports-architecture); falls back to the
 * presence of reports/agents/. Returns null when not found.
 *
 * This is what guarantees the hooks stay inert in projects that don't use the
 * architecture — user-level config must not litter every repo.
 */
export function findReportsRoot(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 8; i++) {
    const reports = path.join(dir, "reports");
    try {
      if (
        fs.existsSync(path.join(reports, ".reports-architecture")) ||
        fs.statSync(path.join(reports, "agents")).isDirectory()
      ) {
        return reports;
      }
    } catch {
      /* not here — keep walking up */
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** 2026-08-12T14-03-55Z — filename-safe timestamp */
export function stamp(d = new Date()) {
  return d.toISOString().replace(/:/g, "-").replace(/\.\d+Z$/, "Z");
}

/** 2026-08-12 */
export function today(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function slug(s, max = 48) {
  return (s || "unnamed")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max) || "unnamed";
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

/** The last assistant message — usually a subagent's actual report. */
export function lastAssistantText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].text;
  }
  return "";
}

/**
 * List content files in a directory, newest first.
 * README.md (the scaffold's per-folder description), files starting with `_`
 * (markers such as _PENDING) and dotfiles are not content.
 */
export function filesByMtime(dir, ext = ".md") {
  try {
    return fs
      .readdirSync(dir)
      .filter(
        (f) =>
          f.endsWith(ext) &&
          f.toLowerCase() !== "readme.md" &&
          !f.startsWith("_") &&
          !f.startsWith(".")
      )
      .map((f) => {
        const full = path.join(dir, f);
        return { name: f, path: full, mtime: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
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
