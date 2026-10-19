// Grok → Claude Code bridge.
// Lets Grok send coding tasks to Claude Code running headless against a checkout
// of this repo. Grok's app connects to /mcp (MCP over Streamable HTTP, OAuth
// sign-in); API bots can also use the plain POST /task endpoint.
// Zero dependencies: Node 20+, git, and the `claude` CLI on PATH.

import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import * as oauth from "./oauth.js";
import { createTask, getTask, recentTasks, isBusy, waitFor, publicView, setupRepo } from "./tasks.js";

const PORT = Number(process.env.PORT || 8787);
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "";
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const MAX_PROMPT_CHARS = 20000;
const MAX_BODY_BYTES = 100000;
// Grok tool calls can time out; return within this and let Grok poll for the rest.
const TOOL_WAIT_MS = Number(process.env.TOOL_WAIT_MS || 20000);

if (BRIDGE_TOKEN.length < 32) {
  console.error("BRIDGE_TOKEN must be set to a random string of at least 32 characters.");
  process.exit(1);
}
if (!process.env.OWNER_PASSWORD) console.warn("OWNER_PASSWORD is not set; Grok's OAuth sign-in will reject every attempt.");

let ready = false;
let setupError = null;

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function bearer(req) {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
}

function authorized(req, pathSecret) {
  if (pathSecret !== undefined) return safeEqual(pathSecret, BRIDGE_TOKEN);
  const token = bearer(req);
  return Boolean(token) && (safeEqual(token, BRIDGE_TOKEN) || oauth.verifyAccessToken(token));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https:; frame-ancestors 'none'",
  });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      const type = req.headers["content-type"] || "";
      try {
        if (type.includes("application/x-www-form-urlencoded")) resolve(Object.fromEntries(new URLSearchParams(data)));
        else resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid request body"));
      }
    });
    req.on("error", reject);
  });
}

function validatePrompt(prompt, sessionId) {
  if (typeof prompt !== "string" || !prompt.trim()) return "prompt is required";
  if (prompt.length > MAX_PROMPT_CHARS) return "prompt is too long";
  if (sessionId !== undefined && sessionId !== "" && !/^[\w-]{1,100}$/.test(sessionId)) return "invalid session_id";
  return null;
}

// ---------- MCP ----------

const TOOLS = [
  {
    name: "start_claude_task",
    description:
      "Give Claude Code a coding task on the WholesaleUSPeptides website repository (React/Vite site). Claude reads and edits " +
      "the code and checks that the site builds. Its changes are pushed to the 'grok-changes' branch for the owner to review; " +
      "nothing goes live automatically. Tasks often take several minutes: if the result says the task is still running, call " +
      "get_claude_task with the task_id until it is done. To follow up on an earlier task, pass its session_id.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "The full task in plain language, with all the details Claude needs." },
        session_id: { type: "string", description: "Optional. The session_id of an earlier task, to continue that conversation." },
      },
      required: ["prompt"],
    },
  },
  {
    name: "get_claude_task",
    description:
      "Check on a Claude Code task. Waits up to about 20 seconds for it to finish, then returns its status, Claude's summary, " +
      "and the link to review the changes. Leave task_id empty to list recent tasks.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string", description: "The task_id returned by start_claude_task." } },
    },
  },
];

function describe(task) {
  const view = publicView(task);
  let text;
  if (task.status === "queued" || task.status === "running") {
    text = `Task ${task.id} is ${task.status}. Call get_claude_task with task_id "${task.id}" to check again.`;
  } else if (task.status === "failed") {
    text = `Task ${task.id} failed: ${task.error}`;
  } else {
    text = `Task ${task.id} is done.\n\n${task.summary || ""}`;
    if (task.git?.pushed) text += `\n\nChanges were pushed to the review branch (commit ${task.git.commit}). Review: ${task.git.review_url}`;
    else if (task.git) text += "\n\nNo files were changed.";
    text += `\n\nsession_id for follow-ups: ${task.session_id}`;
  }
  return { content: [{ type: "text", text }], structuredContent: view };
}

async function callTool(name, args = {}) {
  if (name === "start_claude_task") {
    const problem = validatePrompt(args.prompt, args.session_id);
    if (problem) return { content: [{ type: "text", text: problem }], isError: true };
    if (!ready) return { content: [{ type: "text", text: setupError || "The bridge is still starting up; try again in a minute." }], isError: true };
    const task = createTask(args.prompt, args.session_id || undefined);
    return describe(await waitFor(task, TOOL_WAIT_MS));
  }
  if (name === "get_claude_task") {
    if (!args.task_id) {
      const list = recentTasks().map((t) => `${t.id} · ${t.status} · ${t.prompt.slice(0, 80)}`);
      return { content: [{ type: "text", text: list.length ? list.join("\n") : "No tasks yet." }] };
    }
    const task = getTask(String(args.task_id));
    if (!task) return { content: [{ type: "text", text: `No task with id ${args.task_id} (tasks are forgotten when the server restarts).` }], isError: true };
    return describe(await waitFor(task, TOOL_WAIT_MS));
  }
  throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
}

async function handleRpc(msg) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return { jsonrpc: "2.0", id: msg?.id ?? null, error: { code: -32600, message: "Invalid request" } };
  }
  const isNotification = msg.id === undefined;
  const reply = (result) => (isNotification ? null : { jsonrpc: "2.0", id: msg.id, result });
  try {
    switch (msg.method) {
      case "initialize":
        return reply({
          protocolVersion: msg.params?.protocolVersion || "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "wholesaleuspeptides-claude-code", version: "1.0.0" },
          instructions:
            "Use start_claude_task to have Claude Code change the WholesaleUSPeptides website. Then poll get_claude_task " +
            "until the task is done and share Claude's summary and the review link with the user.",
        });
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call":
        return reply(await callTool(msg.params?.name, msg.params?.arguments));
      default:
        if (isNotification) return null;
        return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } };
    }
  } catch (err) {
    return isNotification ? null : { jsonrpc: "2.0", id: msg.id, error: { code: err.code || -32603, message: err.message } };
  }
}

async function handleMcp(req, res, pathSecret) {
  if (!authorized(req, pathSecret)) {
    return send(res, 401, { error: "Unauthorized" }, {
      "WWW-Authenticate": `Bearer resource_metadata="${PUBLIC_URL}/.well-known/oauth-protected-resource"`,
    });
  }
  if (req.method === "GET") return send(res, 405, { error: "This server does not stream; use POST" }, { Allow: "POST, DELETE" });
  if (req.method === "DELETE") return send(res, 200, {});
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return send(res, 400, { jsonrpc: "2.0", id: null, error: { code: -32700, message: err.message } });
  }
  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map(handleRpc))).filter(Boolean);
    return replies.length ? send(res, 200, replies) : send(res, 202);
  }
  const reply = await handleRpc(body);
  return reply ? send(res, 200, reply) : send(res, 202);
}

// ---------- HTTP routing ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, PUBLIC_URL);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const meta = oauth.metadata(PUBLIC_URL);

  try {
    if (path === "/health") return send(res, 200, { ok: true, ready, busy: isBusy(), error: setupError || undefined });

    if (path === "/.well-known/oauth-protected-resource" || path === "/.well-known/oauth-protected-resource/mcp") {
      return send(res, 200, meta.resource);
    }
    if (path === "/.well-known/oauth-authorization-server" || path === "/.well-known/openid-configuration") {
      return send(res, 200, meta.authServer);
    }
    if (path === "/register" && req.method === "POST") {
      const r = oauth.register(await readBody(req));
      return send(res, r.status, r.body);
    }
    if (path === "/authorize") {
      const params = req.method === "POST" ? await readBody(req) : Object.fromEntries(url.searchParams);
      const r = req.method === "POST" ? oauth.authorizePost(params) : oauth.authorizeGet(params);
      if (r.redirect) {
        res.writeHead(302, { Location: r.redirect, "Cache-Control": "no-store" });
        return res.end();
      }
      return sendHtml(res, r.status, r.html);
    }
    if (path === "/token" && req.method === "POST") {
      const params = await readBody(req);
      const basic = (req.headers.authorization || "").match(/^Basic\s+(.+)$/i);
      if (basic && !params.client_id) params.client_id = decodeURIComponent(Buffer.from(basic[1], "base64").toString().split(":")[0]);
      const r = oauth.token(params);
      return send(res, r.status, r.body);
    }

    if (path === "/mcp") return handleMcp(req, res);
    if (path.startsWith("/mcp/")) return handleMcp(req, res, decodeURIComponent(path.slice(5)));

    // Plain JSON API for bots using the xAI API directly. Waits for the task to finish.
    if (path === "/task" && req.method === "POST") {
      if (!authorized(req)) return send(res, 401, { error: "Unauthorized" });
      if (!ready) return send(res, 503, { error: setupError || "Still starting up" });
      const { prompt, session_id } = await readBody(req);
      const problem = validatePrompt(prompt, session_id);
      if (problem) return send(res, 400, { error: problem });
      const task = await waitFor(createTask(prompt, session_id || undefined), 60 * 60 * 1000);
      return send(res, task.status === "done" ? 200 : 500, publicView(task));
    }

    return send(res, 404, { error: "Not found" });
  } catch (err) {
    if (!res.headersSent) send(res, 400, { error: err.message });
  }
});

server.requestTimeout = 0;
server.headersTimeout = 60000;

server.listen(PORT, () => {
  console.log(`grok-bridge listening on :${PORT}`);
  console.log(`Grok connector URL: ${PUBLIC_URL}/mcp`);
});

setupRepo()
  .then(() => {
    ready = true;
    console.log("Repository ready");
  })
  .catch((err) => {
    setupError = `Repository setup failed: ${err.message}`;
    console.error(setupError);
  });
