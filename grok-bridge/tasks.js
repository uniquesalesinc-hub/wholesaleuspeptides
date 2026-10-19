// Task runner: keeps a small in-memory queue, prepares the git checkout, runs
// Claude Code headless, then commits and pushes any changes to the work branch.

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

const REPO_DIR = process.env.REPO_DIR || "/app/repo";
const GITHUB_REPO = process.env.GITHUB_REPO || ""; // "owner/name"; empty = use REPO_DIR as-is, no git sync
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO_URL = process.env.REPO_URL || `https://github.com/${GITHUB_REPO}.git`;
const BASE_BRANCH = process.env.BASE_BRANCH || "main";
const WORK_BRANCH = process.env.WORK_BRANCH || "grok-changes";
const TIMEOUT_MS = Number(process.env.TASK_TIMEOUT_MS || 15 * 60 * 1000);
const MAX_BUDGET_USD = process.env.MAX_BUDGET_USD || "3";
const MAX_QUEUE = 5;
// Claude edits files and runs the build; the bridge itself does all commits and pushes.
const ALLOWED_TOOLS =
  process.env.ALLOWED_TOOLS ||
  "Read,Grep,Glob,Edit,Write,Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(npm run build:*)";
const SYSTEM_PROMPT =
  "Tasks come from the site owner through their Grok assistant. Make the requested changes in this repository " +
  "and follow CLAUDE.md. Run `npm run build` after code changes to make sure the site still builds. " +
  "Do not commit or push: when you finish, the bridge commits your changes and pushes them to the " +
  `'${WORK_BRANCH}' branch for the owner to review. End with a short plain-language summary of what you changed.`;

const tasks = new Map();
const queue = [];
let running = null;

// Only what Claude Code needs; bridge secrets (GitHub token, owner password) stay out.
function claudeEnv() {
  const keep = ["PATH", "HOME", "LANG", "TERM", "ANTHROPIC_API_KEY", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "NODE_EXTRA_CA_CERTS"];
  return Object.fromEntries(keep.filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
}

function run(cmd, args, { cwd = REPO_DIR, input, env = process.env, timeout = 120000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), timeout);
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: err.message, signal: null });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, signal });
    });
    child.stdin.end(input ?? "");
  });
}

// Auth is passed per command, so the token never lands in .git/config where Claude could read it.
function git(args, opts) {
  const auth = GITHUB_TOKEN
    ? ["-c", `http.extraHeader=Authorization: Basic ${Buffer.from(`x-access-token:${GITHUB_TOKEN}`).toString("base64")}`]
    : [];
  return run("git", [...auth, ...args], opts);
}

async function mustGit(args, opts) {
  const r = await git(args, opts);
  if (r.code !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || r.stdout).trim().slice(-500)}`);
  return r.stdout.trim();
}

export async function setupRepo() {
  if (!GITHUB_REPO) return;
  if (!fs.existsSync(`${REPO_DIR}/.git`)) {
    await mustGit(["clone", REPO_URL, REPO_DIR], { cwd: "/", timeout: 300000 });
  }
  await mustGit(["config", "user.name", process.env.GIT_AUTHOR_NAME || "Grok via Claude Code"]);
  await mustGit(["config", "user.email", process.env.GIT_AUTHOR_EMAIL || "grok-bridge@users.noreply.github.com"]);
  await syncBranch();
  const install = await run("npm", ["install", "--no-audit", "--no-fund"], { timeout: 600000 });
  if (install.code !== 0) console.warn("npm install failed; builds may not work:", install.stderr.slice(-500));
}

// Start every task from a clean work branch that includes the latest base branch.
async function syncBranch() {
  await mustGit(["fetch", "origin", "--prune"], { timeout: 180000 });
  await mustGit(["reset", "--hard"]);
  await mustGit(["clean", "-fd"]);
  const remoteWork = await git(["rev-parse", "--verify", `origin/${WORK_BRANCH}`]);
  if (remoteWork.code === 0) {
    await mustGit(["checkout", "-B", WORK_BRANCH, `origin/${WORK_BRANCH}`]);
    const merge = await git(["merge", "--no-edit", `origin/${BASE_BRANCH}`]);
    if (merge.code !== 0) await git(["merge", "--abort"]);
  } else {
    await mustGit(["checkout", "-B", WORK_BRANCH, `origin/${BASE_BRANCH}`]);
  }
}

async function commitAndPush(prompt) {
  const status = await mustGit(["status", "--porcelain"]);
  const ahead = await git(["rev-list", "--count", `origin/${WORK_BRANCH}..HEAD`]);
  const unpushedMerge = ahead.code !== 0 || Number(ahead.stdout.trim()) > 0;
  if (!status && !unpushedMerge) return { pushed: false };
  if (status) {
    await mustGit(["add", "-A"]);
    const title = prompt.replace(/\s+/g, " ").trim().slice(0, 60);
    await mustGit(["commit", "-m", `Grok task: ${title}`, "-m", `Requested via Grok:\n\n${prompt.slice(0, 2000)}`]);
  }
  await mustGit(["push", "origin", `HEAD:refs/heads/${WORK_BRANCH}`], { timeout: 180000 });
  const commit = await mustGit(["rev-parse", "--short", "HEAD"]);
  return {
    pushed: Boolean(status),
    commit,
    review_url: `https://github.com/${GITHUB_REPO}/compare/${BASE_BRANCH}...${WORK_BRANCH}`,
  };
}

async function runClaude(prompt, sessionId) {
  const args = [
    "-p",
    "--output-format", "json",
    "--permission-mode", "dontAsk",
    "--allowedTools", ALLOWED_TOOLS,
    "--max-budget-usd", MAX_BUDGET_USD,
    "--append-system-prompt", SYSTEM_PROMPT,
  ];
  if (sessionId) args.push("--resume", sessionId);
  const r = await run("claude", args, { input: prompt, env: claudeEnv(), timeout: TIMEOUT_MS });
  if (r.signal) throw new Error(`Claude was stopped (${r.signal}); the time limit is ${Math.round(TIMEOUT_MS / 60000)} minutes`);
  let out;
  try {
    out = JSON.parse(r.stdout);
  } catch {
    throw new Error(`Claude Code exited with code ${r.code}: ${r.stderr.trim().slice(-1000)}`);
  }
  if (out.is_error) throw new Error(out.result || "Claude Code reported an error");
  return { summary: out.result, session_id: out.session_id, cost_usd: out.total_cost_usd, turns: out.num_turns };
}

async function execute(task) {
  task.status = "running";
  task.started_at = new Date().toISOString();
  try {
    if (GITHUB_REPO) await syncBranch();
    Object.assign(task, await runClaude(task.prompt, task.session_id));
    if (GITHUB_REPO) task.git = await commitAndPush(task.prompt);
    task.status = "done";
  } catch (err) {
    task.status = "failed";
    task.error = err.message;
  }
  task.finished_at = new Date().toISOString();
}

async function pump() {
  if (running || !queue.length) return;
  running = queue.shift();
  await execute(running);
  running = null;
  pump();
}

export function createTask(prompt, sessionId) {
  if (queue.length >= MAX_QUEUE) throw new Error("Too many tasks are waiting; try again after the current ones finish");
  const task = {
    id: randomUUID().slice(0, 8),
    status: "queued",
    prompt,
    session_id: sessionId,
    created_at: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  // Keep memory bounded.
  if (tasks.size > 100) tasks.delete(tasks.keys().next().value);
  queue.push(task);
  pump();
  return task;
}

export function getTask(id) {
  return tasks.get(id);
}

export function recentTasks(limit = 5) {
  return [...tasks.values()].slice(-limit).reverse();
}

export function isBusy() {
  return Boolean(running);
}

export async function waitFor(task, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end && (task.status === "queued" || task.status === "running")) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  return task;
}

export function publicView(task) {
  const { prompt, ...rest } = task;
  return { ...rest, prompt: prompt.slice(0, 200) };
}
