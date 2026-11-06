// PreToolUse (Bash/PowerShell): perintah git yang menyentuh main/master/production
// atau force push selalu meminta konfirmasi pengguna (kebijakan branch AGENTS.md).
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = String(input.tool_input?.command ?? "");

const touchesProtected =
  /\bgit\b[^\n;&|]*\b(push|checkout|switch|merge|rebase|reset|branch\s+-[dDmM])\b[^\n;&|]*\b(main|master|production)\b/.test(command);
const forcePush = /\bgit\b[^\n;&|]*\bpush\b[^\n;&|]*(--force\b|--force-with-lease\b|\s-f\b)/.test(command);

if (touchesProtected || forcePush) {
  const reason = touchesProtected
    ? "Perintah menyentuh branch terlindungi (main/master/production). Hanya boleh lewat perintah PA dari pengguna."
    : "Force push terdeteksi. Wajib konfirmasi pengguna.";
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
}
process.exit(0);
