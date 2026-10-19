// Grok → Claude Code bridge.
// A small HTTP service that lets an external bot (e.g. a Grok tool call) hand a
// task to Claude Code running headless against a local checkout of this repo.
// Zero dependencies: Node 18+ and the `claude` CLI on PATH.

import http from "node:http";
import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PORT || 8787);
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "";
const REPO_DIR = process.env.REPO_DIR || process.cwd();
const TIMEOUT_MS = Number(process.env.TASK_TIMEOUT_MS || 10 * 60 * 1000);
const MAX_BUDGET_USD = process.env.MAX_BUDGET_USD || "2";
const MAX_PROMPT_CHARS = 20000;
// Tools Claude may use without asking. Anything not listed is denied.
// No git push by default — review and push changes yourself.
const ALLOWED_TOOLS =
  process.env.ALLOWED_TOOLS ||
  "Read,Grep,Glob,Edit,Write,Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(npm run build:*)";

if (BRIDGE_TOKEN.length < 32) {
  console.error("BRIDGE_TOKEN must be set to a random string of at least 32 characters.");
  process.exit(1);
}

let busy = false;

function authorized(req) {
  const header = req.headers.authorization || "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(BRIDGE_TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_PROMPT_CHARS * 2) reject(new Error("Request body too large"));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function runClaude(prompt, sessionId) {
  const args = [
    "-p",
    "--output-format", "json",
    "--permission-mode", "dontAsk",
    "--allowedTools", ALLOWED_TOOLS,
    "--max-budget-usd", MAX_BUDGET_USD,
  ];
  if (sessionId) args.push("--resume", sessionId);

  return new Promise((resolve) => {
    const child = spawn("claude", args, { cwd: REPO_DIR, env: process.env });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: `Could not start claude: ${err.message}` });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (signal) return resolve({ ok: false, error: `Task stopped (${signal}); timeout is ${TIMEOUT_MS} ms` });
      try {
        const out = JSON.parse(stdout);
        resolve({
          ok: !out.is_error,
          result: out.result,
          session_id: out.session_id,
          cost_usd: out.total_cost_usd,
          turns: out.num_turns,
        });
      } catch {
        resolve({ ok: false, error: `claude exited with code ${code}`, detail: stderr.slice(-2000) });
      }
    });

    child.stdin.end(prompt);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true, busy });

  if (req.method !== "POST" || req.url !== "/task") return send(res, 404, { error: "Not found" });
  if (!authorized(req)) return send(res, 401, { error: "Unauthorized" });
  if (busy) return send(res, 429, { error: "Another task is running; retry shortly" });

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return send(res, 400, { error: err.message });
  }

  const { prompt, session_id } = body;
  if (typeof prompt !== "string" || !prompt.trim()) return send(res, 400, { error: "prompt is required" });
  if (prompt.length > MAX_PROMPT_CHARS) return send(res, 400, { error: "prompt is too long" });
  if (session_id !== undefined && !/^[\w-]{1,100}$/.test(session_id)) {
    return send(res, 400, { error: "invalid session_id" });
  }

  busy = true;
  try {
    const result = await runClaude(prompt, session_id);
    send(res, result.ok ? 200 : 500, result);
  } finally {
    busy = false;
  }
});

// Claude tasks can take minutes; don't let Node cut the request off.
server.requestTimeout = TIMEOUT_MS + 30000;
server.headersTimeout = 60000;

server.listen(PORT, () => {
  console.log(`grok-bridge listening on :${PORT}, repo ${REPO_DIR}`);
});
