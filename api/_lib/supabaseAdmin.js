import { createClient } from "@supabase/supabase-js";

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
    });
  }
  return client;
}
