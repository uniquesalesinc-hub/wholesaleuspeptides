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
  const {
    data: profile,
    error: profileError,
    status: profileStatus,
  } = await supabase
    .from("admin_profiles")
    .select("id,name")
    .eq("id", data.user.id)
    .maybeSingle();

  // A failed query and a genuinely absent row are different conditions and
  // must not be collapsed into one answer. PostgREST returns an empty
  // result (200, data null, error null) when a row is filtered out rather
  // than an error, so without this split a misconfigured key, a wrong
  // project, or a table PostgREST cannot see all present identically as
  // "this user is not an admin."
  if (profileError) {
    console.error("admin_profiles lookup failed:", {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      httpStatus: profileStatus,
      ...describeAdminLookupContext(data.user),
    });
    return { error: "profile_lookup_failed" };
  }

  if (!profile) {
    console.error("admin_profiles lookup returned no row:", {
      httpStatus: profileStatus,
      ...describeAdminLookupContext(data.user),
    });
    return { error: "not_admin" };
  }

  return { user: data.user, profile };
}

// Emitted only when the lookup fails, so successful requests stay quiet.
// Reports the identifiers and configuration fingerprint needed to tell the
// failure modes apart, without ever revealing a key: keys are reduced to
// their format prefix and length, which is enough to catch a wrong or
// swapped key type but discloses none of the secret itself.
function describeAdminLookupContext(user) {
  const url = process.env.VITE_SUPABASE_URL || "";
  return {
    authenticatedUserId: user?.id,
    authenticatedUserEmail: user?.email,
    lookupIdUsed: user?.id,
    supabaseProjectRef: url.replace(/^https?:\/\//, "").split(".")[0] || "(unset)",
    supabaseUrlConfigured: Boolean(process.env.VITE_SUPABASE_URL),
    dbQueryKey: describeKey(process.env.SUPABASE_SECRET_KEY),
    authVerifyKey: describeKey(process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  };
}

function describeKey(key) {
  if (!key) return "(not set)";
  const format = key.startsWith("sb_secret_")
    ? "sb_secret_"
    : key.startsWith("sb_publishable_")
    ? "sb_publishable_"
    : key.startsWith("eyJ")
    ? "legacy-jwt"
    : "unrecognized";
  return `${format} (length ${key.length})`;
}
