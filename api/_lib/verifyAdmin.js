import { getSupabaseAdmin, getSupabaseAuthVerifier } from "./supabaseAdmin.js";

// Verifies the Authorization: Bearer <supabase access token> header sent
// by the admin frontend (src/lib/adminApi.js), then confirms the
// authenticated user is an allow-listed admin (has a row in
// admin_profiles) — not just "logged into Supabase somehow." Never trusts
// any client-supplied "isAdmin" flag.
export async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "missing_token" };

  // Token verification runs against the user-context endpoint, so it uses
  // the publishable-key client (see getSupabaseAuthVerifier). The reason
  // is logged server-side only — the caller still gets a generic
  // invalid_token so we never leak auth internals to the browser.
  const { data, error } = await getSupabaseAuthVerifier().auth.getUser(token);
  if (error || !data?.user) {
    console.error("Admin token verification failed:", error?.message || "no user returned");
    return { error: "invalid_token" };
  }

  // Database access continues to use the secret-key client, which is what
  // bypasses RLS on admin_profiles.
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id,name")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) return { error: "not_admin" };

  return { user: data.user, profile };
}
