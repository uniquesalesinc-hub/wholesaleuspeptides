// Example Grok side: asks Grok a question and lets it call Claude Code through
// the bridge as a tool. Usage:
//   XAI_API_KEY=... BRIDGE_URL=http://host:8787 BRIDGE_TOKEN=... \
//     node grok-client.js "Change the hero subtitle to ..."

const XAI_API_KEY = process.env.XAI_API_KEY;
const GROK_MODEL = process.env.GROK_MODEL || "grok-4";
const BRIDGE_URL = process.env.BRIDGE_URL || "http://localhost:8787";
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN;

const tools = [
  {
    type: "function",
    function: {
      name: "run_claude_code",
      description:
        "Send a coding task to Claude Code, which works inside the WholesaleUSPeptides website repository " +
        "(read files, edit code, run the build). Returns Claude's summary of what it did. " +
        "Pass session_id from a previous call to continue that same conversation.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "The full task for Claude Code, in plain language." },
          session_id: { type: "string", description: "Optional: continue an earlier Claude Code session." },
        },
        required: ["prompt"],
      },
    },
  },
];

async function runClaudeCode(args) {
  const res = await fetch(`${BRIDGE_URL}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${BRIDGE_TOKEN}` },
    body: JSON.stringify(args),
  });
  return res.json();
}

async function chat(messages) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${XAI_API_KEY}` },
    body: JSON.stringify({ model: GROK_MODEL, messages, tools }),
  });
  if (!res.ok) throw new Error(`xAI API ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message;
}

async function main() {
  const task = process.argv.slice(2).join(" ");
  if (!task || !XAI_API_KEY || !BRIDGE_TOKEN) {
    console.error("Set XAI_API_KEY and BRIDGE_TOKEN, and pass a task as the argument.");
    process.exit(1);
  }

  const messages = [{ role: "user", content: task }];
  for (let step = 0; step < 10; step++) {
    const reply = await chat(messages);
    messages.push(reply);
    if (!reply.tool_calls?.length) {
      console.log(reply.content);
      return;
    }
    for (const call of reply.tool_calls) {
      console.error(`→ Claude Code: ${call.function.arguments}`);
      const result = await runClaudeCode(JSON.parse(call.function.arguments));
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  console.error("Stopped after 10 steps.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
