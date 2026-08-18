import { getSupabaseAdmin } from "./supabaseAdmin.js";

// Verifies the Authorization: Bearer <supabase access token> header sent
// by the admin frontend (src/lib/adminApi.js), then confirms the
// authenticated user is an allow-listed admin (has a row in
// admin_profiles) — not just "logged into Supabase somehow." Never trusts
// any client-supplied "isAdmin" flag.
export async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { error: "missing_token" };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { error: "invalid_token" };

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id,name")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) return { error: "not_admin" };

  return { user: data.user, profile };
}
