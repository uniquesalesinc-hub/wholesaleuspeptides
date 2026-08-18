import { supabase } from "./supabaseClient";

async function authedFetch(path, options = {}) {
  if (!supabase) throw new Error("Admin authentication is not configured.");
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || `Request failed (${res.status})`);
  return body;
}

export const listOrders = () => authedFetch("/api/admin/orders");
export const getOrder = (id) => authedFetch(`/api/admin/orders/${id}`);
export const runOrderAction = (id, action, body) =>
  authedFetch(`/api/admin/orders/${id}/${action}`, { method: "POST", body: JSON.stringify(body || {}) });
