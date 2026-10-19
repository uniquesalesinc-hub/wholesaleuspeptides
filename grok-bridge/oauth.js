// Minimal OAuth 2.1 authorization server for the Grok connector: dynamic client
// registration, authorization code + PKCE (S256), refresh tokens. The only
// "user" is the site owner, who signs in with OWNER_PASSWORD.
// Clients and tokens are HMAC-signed, so nothing is lost when the server restarts;
// changing BRIDGE_TOKEN revokes everything.

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || "";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "";
const ACCESS_TTL_S = 30 * 24 * 3600;
const REFRESH_TTL_S = 365 * 24 * 3600;
const CODE_TTL_MS = 5 * 60 * 1000;
// Pre-registered client id for connector forms that ask for one (leave the secret blank).
export const STATIC_CLIENT_ID = process.env.OAUTH_CLIENT_ID || "grok-bridge";
const STATIC_REDIRECT_HOSTS = ["grok.com", "x.ai", "x.com"];

const key = createHmac("sha256", BRIDGE_TOKEN).update("grok-bridge-oauth-v1").digest();
const codes = new Map();
let failedLogins = [];

const b64 = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const sign = (data) => createHmac("sha256", key).update(data).digest("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function seal(payload) {
  const body = b64(payload);
  return `${body}.${sign(body)}`;
}

function unseal(token) {
  const [body, mac, extra] = String(token || "").split(".");
  if (!body || !mac || extra !== undefined || !safeEqual(mac, sign(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

const now = () => Math.floor(Date.now() / 1000);

function issueTokens() {
  return {
    access_token: seal({ typ: "access", exp: now() + ACCESS_TTL_S, n: randomBytes(6).toString("hex") }),
    token_type: "Bearer",
    expires_in: ACCESS_TTL_S,
    refresh_token: seal({ typ: "refresh", exp: now() + REFRESH_TTL_S, n: randomBytes(6).toString("hex") }),
    scope: "claude",
  };
}

export function verifyAccessToken(token) {
  return unseal(token)?.typ === "access";
}

function clientFor(clientId) {
  if (clientId === STATIC_CLIENT_ID) return { client_name: "Grok", static: true };
  const c = unseal(clientId);
  return c?.typ === "client" ? c : null;
}

function redirectAllowed(client, redirectUri) {
  let url;
  try {
    url = new URL(redirectUri);
  } catch {
    return false;
  }
  if (client.static) {
    return url.protocol === "https:" && STATIC_REDIRECT_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  }
  return client.redirect_uris.includes(redirectUri);
}

export function metadata(base) {
  return {
    authServer: {
      issuer: base,
      authorization_endpoint: `${base}/authorize`,
      token_endpoint: `${base}/token`,
      registration_endpoint: `${base}/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
      scopes_supported: ["claude"],
    },
    resource: {
      resource: `${base}/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ["header"],
      scopes_supported: ["claude"],
    },
  };
}

export function register(body) {
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u) => typeof u === "string") : [];
  if (!uris.length || uris.some((u) => !/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(u))) {
    return { status: 400, body: { error: "invalid_redirect_uri" } };
  }
  const client_name = String(body.client_name || "Connector").slice(0, 80);
  const client_id = seal({ typ: "client", redirect_uris: uris, client_name });
  return {
    status: 201,
    body: {
      client_id,
      client_id_issued_at: now(),
      client_name,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function loginPage(params, client, error) {
  const hidden = ["client_id", "redirect_uri", "state", "code_challenge", "code_challenge_method", "scope"]
    .map((k) => `<input type="hidden" name="${k}" value="${escapeHtml(params[k] || "")}">`)
    .join("");
  const host = escapeHtml(new URL(params.redirect_uri).host);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connect Claude Code</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05111F;color:#FFFFFF;font-family:system-ui,-apple-system,sans-serif;padding:16px}
.card{background:#0A1E30;border:1px solid #D4AF37;border-radius:12px;padding:28px;max-width:380px;width:100%}
h1{font-size:20px;margin:0 0 8px;color:#D4AF37}p{color:#FAFAFA;font-size:14px;line-height:1.5}.muted{color:#7D8794;font-size:13px}
input[type=password]{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #7D8794;background:#05111F;color:#FFFFFF;font-size:16px;margin:12px 0}
button{width:100%;padding:12px;border:0;border-radius:8px;background:#D4AF37;color:#05111F;font-weight:600;font-size:16px;cursor:pointer}
.err{color:#D4AF37;font-weight:600}
</style></head><body><form class="card" method="post" action="/authorize">
<h1>Connect Claude Code</h1>
<p><strong>${escapeHtml(client.client_name)}</strong> wants to send coding tasks to Claude Code for the WholesaleUSPeptides repository.</p>
<p class="muted">After you approve, you'll be sent back to ${host}. Only continue if you started this from your Grok connector settings.</p>
${error ? `<p class="err">${escapeHtml(error)}</p>` : ""}
${hidden}<input type="password" name="password" placeholder="Owner password" autocomplete="current-password" required autofocus>
<button type="submit">Approve</button></form></body></html>`;
}

function validateAuthorize(params) {
  const client = clientFor(params.client_id);
  if (!client) return { error: "Unknown client. Remove the connector in Grok and add it again." };
  if (!params.redirect_uri || !redirectAllowed(client, params.redirect_uri)) return { error: "This redirect address isn't allowed." };
  if (params.response_type && params.response_type !== "code") return { error: "Unsupported response_type." };
  if (!params.code_challenge || (params.code_challenge_method || "S256") !== "S256") {
    return { error: "PKCE (S256) is required." };
  }
  return { client };
}

// Returns { status, html } or { redirect }.
export function authorizeGet(params) {
  const { client, error } = validateAuthorize(params);
  if (error) return { status: 400, html: `<p>${escapeHtml(error)}</p>` };
  return { status: 200, html: loginPage(params, client) };
}

export function authorizePost(params) {
  const { client, error } = validateAuthorize(params);
  if (error) return { status: 400, html: `<p>${escapeHtml(error)}</p>` };

  const windowStart = Date.now() - 15 * 60 * 1000;
  failedLogins = failedLogins.filter((t) => t > windowStart);
  if (failedLogins.length >= 10) {
    return { status: 429, html: loginPage(params, client, "Too many wrong attempts. Wait 15 minutes and try again.") };
  }
  if (!OWNER_PASSWORD || !safeEqual(params.password || "", OWNER_PASSWORD)) {
    failedLogins.push(Date.now());
    return { status: 401, html: loginPage(params, client, "Wrong password.") };
  }

  const code = randomBytes(24).toString("base64url");
  codes.set(code, {
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    expires: Date.now() + CODE_TTL_MS,
  });
  for (const [c, v] of codes) if (v.expires < Date.now()) codes.delete(c);

  const url = new URL(params.redirect_uri);
  url.searchParams.set("code", code);
  if (params.state) url.searchParams.set("state", params.state);
  return { redirect: url.toString() };
}

export function token(params) {
  const fail = (error, description) => ({ status: 400, body: { error, error_description: description } });

  if (params.grant_type === "authorization_code") {
    const entry = codes.get(params.code);
    codes.delete(params.code);
    if (!entry || entry.expires < Date.now()) return fail("invalid_grant", "Code is invalid or expired");
    if (params.client_id && params.client_id !== entry.client_id) return fail("invalid_grant", "Client mismatch");
    if (params.redirect_uri && params.redirect_uri !== entry.redirect_uri) return fail("invalid_grant", "Redirect URI mismatch");
    const challenge = createHash("sha256").update(params.code_verifier || "").digest("base64url");
    if (!safeEqual(challenge, entry.code_challenge)) return fail("invalid_grant", "PKCE verification failed");
    return { status: 200, body: issueTokens() };
  }

  if (params.grant_type === "refresh_token") {
    if (unseal(params.refresh_token)?.typ !== "refresh") return fail("invalid_grant", "Refresh token is invalid or expired");
    return { status: 200, body: issueTokens() };
  }

  return fail("unsupported_grant_type", "Use authorization_code or refresh_token");
}
