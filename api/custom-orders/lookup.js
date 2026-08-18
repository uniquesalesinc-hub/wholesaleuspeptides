import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

// Public endpoint backing the customer-facing order-status page. Looked
// up by the opaque access_token (never the sequential order_number, which
// is trivially guessable), and returns only the fields that page needs —
// never the customer's own email/phone/message, even though it's their
// own data, to keep the surface minimal.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "missing_token" });

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("custom_orders")
    .select(
      "order_number,status,product_name,strength,quantity,order_total,deposit_amount,deposit_status,balance_amount,balance_status,tracking_carrier,tracking_number,shipped_at,created_at"
    )
    .eq("access_token", token)
    .maybeSingle();

  if (error || !order) return res.status(404).json({ error: "not_found" });
  res.status(200).json({ order });
}
