import { createClient } from "@supabase/supabase-js";

// Used client-side ONLY for admin authentication (Supabase Auth). Order
// data is never read or written through this client — every order
// read/write goes through this app's own /api endpoints, which
// authenticate with the server-only SUPABASE_SECRET_KEY. This client only
// ever holds the publishable key, which is safe to ship to the browser.
//
// createClient() throws synchronously if the URL/key are missing, and
// this module is imported (transitively, via the admin/order-status page
// components) from the App.jsx bundle that also serves the public
// marketing site — so a missing or misconfigured Supabase env var must
// never be allowed to crash module evaluation and take the whole site
// down with it. Exported as null in that case; every call site below
// checks for it and degrades to an error message instead.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
