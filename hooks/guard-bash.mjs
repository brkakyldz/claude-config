// PreToolUse / Bash — dangerous command guard.
//
// Rationale: "deny always overrides allow", and the permission model should be
// narrowed from the start rather than widened later. The `permissions.deny`
// list in settings.json does static string matching; this hook catches the same
// prohibitions anywhere inside the command line, including after pipes and
// chaining operators.
//
// Output: permissionDecision "deny" — the call is blocked and the reason is
// returned to the model.

import { readInput, safe } from "./lib.mjs";

// Command position: start of line, or after ; && || | ( — a plain space is NOT
// enough, otherwise `echo 'sudo ...'` and similar textual mentions get blocked
// and the user is pushed into disabling the hook entirely.
const CMD = String.raw`(?:^|[;&|(\n])\s*`;

const RULES = [
  {
    // rm -rf / rm -fr / rm -Rf ...
    re: new RegExp(CMD + String.raw`rm\s+(?:-[a-zA-Z]*\s+)*-[a-zA-Z]*(?:[rR][a-zA-Z]*f|f[a-zA-Z]*[rR])`),
    why: "rm -rf is blocked. Delete files individually, or use a recoverable path (recycle/trash).",
  },
  {
    // evading the rules by wrapping them in sh -c "..." / bash -c '...'
    re: /\b(?:ba)?sh\s+-c\b[^\n]*(?:rm\s+-[a-zA-Z]*[rRf]|sudo\s)/,
    why: "rm -rf / sudo inside an sh -c wrapper is blocked. Write the command directly, without the prohibited parts.",
  },
  {
    re: new RegExp(CMD + String.raw`sudo(?:\s|$)`),
    why: "sudo is blocked. If elevated privileges are needed, the user must run it themselves.",
  },
  {
    // --force present, but not --force-with-lease
    re: /\bgit\s+push\b[^\n]*--force(?!-with-lease)\b|\bgit\s+push\b[^\n]*\s-f(\s|$)/,
    why: "git push --force is blocked. Use --force-with-lease if you must, and ask the user first.",
  },
  {
    re: /\bgit\s+reset\s+--hard\b/,
    why: "git reset --hard irreversibly discards the working tree. Stash or commit first, or ask the user.",
  },
  {
    re: /~\/\.ssh|\.ssh\/(id_|authorized_keys|config)|\/\.ssh\b/,
    why: "Access to ~/.ssh is blocked (private keys).",
  },
  {
    // .env, .env.local, path/.env — but not .environment
    re: /\.credentials\.json|\.claude\.json\b|(?:^|[\s;&|(='"/])\.env(?:\.[\w-]+)?(?=$|[\s;&|)'"])/,
    why: "Direct access to credential / .env files is blocked. Ask the user if you need those values.",
  },
  {
    re: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n]*\|\s*(ba)?sh\b|\b(curl|wget)\b[^\n]*\|\s*(python|node)\b/,
    why: "Piping a download straight into a shell (curl | sh) is blocked. Download it, read it, then run it.",
  },
  {
    re: /\bgit\s+(commit|push)\b[^\n]*--no-verify\b/,
    why: "--no-verify skips hooks. If a hook fails, fix the cause.",
  },
];

safe(async () => {
  const input = await readInput();
  if (input.tool_name !== "Bash") return;
  const cmd = String(input?.tool_input?.command || "");
  if (!cmd) return;

  const hit = RULES.find((r) => r.re.test(cmd));
  if (!hit) return;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `[guard-bash] ${hit.why}`,
      },
    })
  );
});
