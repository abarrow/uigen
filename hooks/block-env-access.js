/**
 * Claude Code PreToolUse Hook: Block .env File Access
 *
 * This script runs BEFORE Claude executes a tool call. Claude Code
 * passes the tool call details as a JSON object via stdin.
 *
 * How hooks communicate back to Claude Code (via JSON on stdout):
 *
 * - No output + exit 0
 *     Allow the tool call. The tool executes as normal.
 *
 * - {"decision":"block","reason":"..."}
 *     Block THIS tool call only. Claude sees the reason and continues
 *     the conversation — it can try a different approach or respond
 *     to the user. Use this when you want to deny a specific action
 *     without interrupting the overall workflow.
 *
 * - {"continue":false,"stopReason":"..."}
 *     Stop the ENTIRE conversation turn. Claude stops generating
 *     completely and the stopReason is displayed to the user. Use
 *     this for critical violations where Claude should not continue
 *     doing anything at all (e.g. a security policy breach).
 *
 * - Non-zero exit code
 *     Treated as a hook error. The tool call still proceeds — hook
 *     failures are non-blocking by design so a broken hook doesn't
 *     halt all work.
 *
 * The JSON object from stdin includes:
 * - tool_name: the tool being called (e.g. "Read", "Edit", "Write", "Bash")
 * - tool_input: the parameters passed to the tool (varies by tool)
 *
 * For file-based tools (Read, Edit, Write), tool_input contains "file_path".
 * For Bash, tool_input contains "command" (the shell command string).
 */

async function main() {
  // Read the full JSON payload from stdin.
  // Claude Code pipes the tool call info here before the tool executes.
  // We collect raw Buffer chunks, then concatenate them at the end —
  // this is safer than string += because it correctly handles multi-byte
  // characters that might be split across chunk boundaries.
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  // Parse the tool call details
  const toolCall = JSON.parse(Buffer.concat(chunks).toString());
  const { tool_name, tool_input } = toolCall;

  // We need to check two scenarios where .env files could be accessed:
  //
  // 1. File tools (Read, Edit, Write) — these have a "file_path" parameter
  //    that directly tells us which file is being targeted.
  //
  // 2. Bash tool — someone could run `cat .env`, `vim .env`, etc.
  //    We check the "command" string for .env references.

  let shouldBlock = false;
  let reason = "";

  // --- Check file-based tools ---
  // Tools like Read, Edit, and Write pass a "file_path" in their input.
  // We check if that path includes ".env" anywhere in it.
  // This catches: .env, .env.local, .env.production, src/.env, etc.
  if (tool_input.file_path && isEnvFile(tool_input.file_path)) {
    shouldBlock = true;
    reason = `Blocked: "${tool_name}" tried to access "${tool_input.file_path}" which is a .env file.`;
  }

  // --- Check Bash commands ---
  // Bash tool input has a "command" string. We look for .env as a file
  // path argument — not just any mention of ".env" in the string.
  // For example, `cat .env` or `source /path/to/.env.local` should block,
  // but a commit message that says "block access to .env file" should not.
  // We use a regex that requires .env to look like a file path: preceded
  // by a space, slash, or start of string — not embedded in prose.
  if (tool_name === "Bash" && tool_input.command && isEnvInBashCommand(tool_input.command)) {
    shouldBlock = true;
    reason = `Blocked: Bash command references a .env file — "${tool_input.command}"`;
  }

  if (shouldBlock) {
    // Output a JSON response telling Claude Code to block this tool call.
    // For PreToolUse hooks, we use "decision" (not "result") to signal blocking.
    // The "reason" is shown to Claude so it understands why the call was denied.
    const response = {
      decision: "block",
      reason,
    };
    process.stdout.write(JSON.stringify(response));
  }

  // If we don't output anything and exit 0, the tool call proceeds as normal.
}

// Run the main function
main();

/**
 * Checks whether a string contains a reference to a .env file.
 *
 * Uses a simple .includes() check for the ".env" substring.
 * The leading dot makes this specific enough to avoid false positives —
 * it's hard to have ".env" in a path without it actually being a .env file.
 */
function isEnvFile(str) {
  return str.includes(".env");
}

/**
 * Checks whether a Bash command targets a .env file as a path argument.
 *
 * Unlike isEnvFile(), this is stricter — it requires .env to appear as a
 * file path, not just anywhere in the string. This prevents false positives
 * like a git commit message that mentions ".env" in its text.
 *
 * Matches when .env is preceded by:
 * - a space (e.g. `cat .env`)
 * - a slash (e.g. `cat /path/to/.env.local`)
 * - start of string (e.g. `.env` as the entire command, unlikely but safe)
 *
 * Does NOT match:
 * - ".env" inside quoted prose (e.g. `git commit -m "protect .env file"`)
 *   because those are typically inside quotes after -m, not file arguments
 */
function isEnvInBashCommand(command) {
  // Strip quoted strings so we don't match .env inside commit messages,
  // echo statements, etc. This removes both single- and double-quoted
  // sections, leaving only the "structural" parts of the command.
  const withoutQuotes = command.replace(/"[^"]*"|'[^']*'/g, "");

  // Now check if .env appears as a path-like argument in what remains
  return /(^|[\s/])\.env(\s|\/|\.|$)/i.test(withoutQuotes);
}
