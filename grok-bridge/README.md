# Grok → Claude Code bridge

A small HTTP service that lets a Grok bot send coding tasks to Claude Code. Grok
calls it as a tool. Claude Code runs headless (`claude -p`) in a checkout of
this repo and replies with a summary of what it did.

```
Grok bot ──tool call──▶ POST /task (server.js) ──▶ claude -p in REPO_DIR ──▶ result back to Grok
```

This runs on its own machine, such as a small VPS or a Docker host. It is **not**
part of the Vercel site, and it can't run as a Vercel function, because Claude
Code needs a long-running process and a real git checkout.

## Setup

1. On the server, install Node 18+ and Claude Code:
   `npm install -g @anthropic-ai/claude-code`
2. Clone this repo somewhere, e.g. `/srv/wholesaleuspeptides`. That checkout is
   what Claude edits.
3. Copy `grok-bridge/.env.example` to `grok-bridge/.env` and fill it in
   (`BRIDGE_TOKEN` from `openssl rand -hex 32`, your `ANTHROPIC_API_KEY`, and
   `REPO_DIR`).
4. Start it: `cd grok-bridge && node --env-file=.env server.js`
   (use systemd, pm2 or Docker to keep it running).
5. Put it behind HTTPS (Caddy, nginx or a Cloudflare Tunnel) before exposing it
   to the internet. Grok must reach it over `https://`.

Check it: `curl https://your-host/health` should return `{"ok":true,"busy":false}`.

## API

`POST /task`, with header `Authorization: Bearer <BRIDGE_TOKEN>`

```json
{ "prompt": "Update the hero subtitle to ...", "session_id": "optional, from a previous reply" }
```

Response:

```json
{ "ok": true, "result": "Claude's summary", "session_id": "…", "cost_usd": 0.12, "turns": 6 }
```

- To continue a conversation, send the `session_id` from the previous reply.
- Only one task runs at a time. A second request gets `429` and should retry.
- Each task is capped by `MAX_BUDGET_USD` and `TASK_TIMEOUT_MS`.

## Connecting Grok

Give your Grok bot this tool definition (OpenAI-compatible function calling, which the
xAI API uses), and when Grok calls it, POST the arguments to `/task`:

```json
{
  "type": "function",
  "function": {
    "name": "run_claude_code",
    "description": "Send a coding task to Claude Code, which works inside the WholesaleUSPeptides website repository. Returns Claude's summary. Pass session_id to continue an earlier session.",
    "parameters": {
      "type": "object",
      "properties": {
        "prompt": { "type": "string" },
        "session_id": { "type": "string" }
      },
      "required": ["prompt"]
    }
  }
}
```

`grok-client.js` is a complete working example of that loop:

```
cd grok-bridge
node --env-file=.env grok-client.js "Make the footer copyright year 2026"
```

## Safety defaults

- Every request needs the bearer token. Keep it, the Anthropic key and the xAI
  key in `.env` or your host's secret store, never in git.
- Claude runs in `dontAsk` mode, so anything outside `ALLOWED_TOOLS` is denied.
  By default it can read and edit files, run `git status/diff/log` and
  `npm run build`. It **cannot** push, install packages or run other commands.
  Review the changes in `REPO_DIR`, then commit and push them yourself. If you
  want Claude to commit and push automatically, add e.g. `Bash(git add:*)`,
  `Bash(git commit:*)` and `Bash(git push:*)` to `ALLOWED_TOOLS`. Ideally,
  point it at a working branch rather than `main`.
- Claude reads the repo's `CLAUDE.md`, so the brand and pricing rules still apply
  to tasks that come from Grok.
