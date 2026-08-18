import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { verifyAdmin } from "../../_lib/verifyAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const { error: authError } = await verifyAdmin(req);
  if (authError) return res.status(401).json({ error: authError });

  const { id } = req.query;
  const supabase = getSupabaseAdmin();
  const [{ data: order, error }, { data: events }] = await Promise.all([
    supabase.from("custom_orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("custom_order_events").select("*").eq("order_id", id).order("created_at", { ascending: true }),
  ]);

  if (error || !order) return res.status(404).json({ error: "not_found" });
  res.status(200).json({ order, events: events || [] });
}
