import { createClient } from "@supabase/supabase-js";

// New-format Supabase keys (sb_secret_…, sb_publishable_…) are opaque
// tokens, not JWTs, and Supabase's gateway rejects them outright if they
// arrive on the Authorization header — they are only valid on `apikey`.
// The installed @supabase/supabase-js (2.112.3) knows this for its
// Functions client (see its internal `omitApiKeyAsBearer` option) but not
// yet for the plain REST/Postgrest client returned by `.from()`: with no
// signed-in session, it falls back to sending the *same* key again on
// Authorization as a Bearer token, which is exactly what breaks it (this
// was the cause of the "Invalid API key" failure on admin_profiles
// lookups). There is no public createClient option to disable that
// fallback, so this custom fetch removes only that exact, erroneous
// header — it never sets or invents an Authorization value itself.
function stripKeyAsBearerFetch(key) {
  return (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    return fetch(input, { ...init, headers });
  };
}

// Server-only client, authenticated with the Supabase SECRET key (the new
// Supabase key format's server-side key — never the client-safe
// publishable key). This bypasses Row Level Security by design, which is
// intentional: every custom_orders/custom_order_events/admin_profiles
// read or write in this app goes through this client, inside a Vercel
// serverless function. The browser never imports this module.
let client;

export function getSupabaseAdmin() {
  if (!client) {
    const url = process.env.VITE_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY environment variable.");
    }
    client = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: stripKeyAsBearerFetch(secretKey) },
    });
  }
  return client;
}

// Separate client used ONLY to verify a signed-in user's Auth access token.
//
// auth.getUser(jwt) calls GET /auth/v1/user, which is a *user-context*
// endpoint: it expects the project's publishable (client) key as `apikey`
// alongside the user's JWT as the bearer token. The secret key is for
// service/admin operations and is not a valid `apikey` for that route
// under Supabase's new key format, where publishable and secret keys are
// strictly separated — pairing it with a user JWT there gets rejected.
//
// This client therefore carries the publishable key only. It is never
// used for table access: every database read/write still goes through
// getSupabaseAdmin() above, which holds the secret key and bypasses RLS.
let authVerifierClient;

export function getSupabaseAuthVerifier() {
  if (!authVerifierClient) {
    const url = process.env.VITE_SUPABASE_URL;
    // Falls back to the secret key only if the publishable key is not
    // exposed to the function runtime, so this is never worse than the
    // previous behavior.
    const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const key = publishableKey || process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variable.");
    }
    if (!publishableKey) {
      console.warn(
        "VITE_SUPABASE_PUBLISHABLE_KEY is not set in this runtime; falling back to the secret key for token verification, which the user-context endpoint may reject."
      );
    }
    authVerifierClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return authVerifierClient;
}
