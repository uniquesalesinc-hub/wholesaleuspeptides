# Grok → Claude Code bridge

Lets Grok send coding tasks to Claude Code for this repository. Claude edits the
site, checks that it still builds, and pushes the changes to the **`grok-changes`**
branch. Nothing goes live until you merge that branch.

```
Grok app ──MCP connector──▶ bridge on Render (/mcp) ──▶ Claude Code in a copy of this repo
                                                            └─▶ git push → grok-changes branch → you review & merge
```

The bridge runs on Render because Claude Code needs an always-on machine with a
real git checkout. The website itself stays on Vercel and is unaffected.

## One-time setup

### 1. Get the three keys

| Key | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys → **Create Key** |
| `GITHUB_TOKEN` | https://github.com/settings/personal-access-tokens/new. Choose **Only select repositories** → `wholesaleuspeptides`, then **Repository permissions → Contents: Read and write**. |
| `OWNER_PASSWORD` | Make one up. You type it once when connecting Grok. |

Enter these only in Render's form, never in chat or in the repo.

### 2. Deploy on Render

1. Go to https://dashboard.render.com/blueprints → **New Blueprint Instance**.
2. Connect GitHub if asked, then pick **uniquesalesinc-hub/wholesaleuspeptides**
   (branch `main`). Render reads `render.yaml` and shows the service
   **grok-claude-bridge**.
3. Paste the three keys into the fields Render asks for. `BRIDGE_TOKEN` is
   generated for you. Click **Apply**.
4. Wait for the deploy to show **Live** (first boot clones the repo, which takes
   about 2–4 minutes). Then open `https://<your-service>.onrender.com/health`. It
   should say `"ready":true`.

Plan: Render **Starter** (about $7/month), so the bridge doesn't fall asleep.

### 3. Connect Grok

1. Go to https://grok.com/connectors → **New Connector** → **Custom**.
2. URL: `https://<your-service>.onrender.com/mcp`
3. When Grok opens the sign-in page, enter your `OWNER_PASSWORD` and click **Approve**.
   - If Grok asks for a **Client ID**, enter `grok-bridge` and leave the secret blank.
   - If Grok won't do the sign-in, use this URL instead with no auth:
     `https://<your-service>.onrender.com/mcp/<BRIDGE_TOKEN>`. Copy `BRIDGE_TOKEN`
     from Render → service → **Environment**. Treat that URL like a password.
4. In a Grok chat, enable the connector and ask, for example:
   *"Use Claude Code to change the footer copyright year to 2026."*

Grok calls `start_claude_task`, checks on it with `get_claude_task` until it's
done, then replies with Claude's summary and a GitHub link to review the change.

### 4. Review and publish

Open the review link, or go to GitHub → **Pull requests → New** with
`main` ← `grok-changes`. Merge it when you're happy, and Vercel deploys the site
as usual. The next Grok task starts from the latest `main` automatically.

## Limits and safety

- Only you can connect: sign-in needs `OWNER_PASSWORD` (10 wrong tries locks it for 15 min).
  To disconnect every Grok session at once, change `BRIDGE_TOKEN` in Render.
- Claude can read and edit files and run `npm run build`. It can't push, install
  packages or run other commands. The bridge itself commits and pushes, and only to
  `grok-changes`. The GitHub token is never given to Claude.
- Each task is capped at `MAX_BUDGET_USD` ($3) of Anthropic usage and 15 minutes.
  One task runs at a time, and up to 5 can wait in line.
- Claude follows `CLAUDE.md`, so brand and pricing rules still apply.
- The task list is kept in memory and resets when Render restarts the service.

## Settings (Render → Environment)

| Variable | Default | Meaning |
|---|---|---|
| `GITHUB_REPO` | `uniquesalesinc-hub/wholesaleuspeptides` | Repo to clone and push to |
| `BASE_BRANCH` / `WORK_BRANCH` | `main` / `grok-changes` | Start from / push to |
| `MAX_BUDGET_USD` | `3` | Per-task Anthropic spend cap |
| `TASK_TIMEOUT_MS` | `900000` | Per-task time limit |
| `ALLOWED_TOOLS` | read/edit + build | Tools Claude may use |

## For API bots (optional)

Bots that call the xAI API directly can skip MCP and `POST /task` with
`Authorization: Bearer <BRIDGE_TOKEN>` and a body of `{"prompt": "...", "session_id": "optional"}`.
The request waits for the task to finish. `grok-client.js` is a working example
of that loop.

## Running locally

```
cp .env.example .env   # fill it in
node --env-file=.env server.js
```
