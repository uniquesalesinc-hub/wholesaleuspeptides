import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { verifyAdmin } from "../../_lib/verifyAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const { error: authError } = await verifyAdmin(req);
  if (authError) return res.status(401).json({ error: authError });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("custom_orders")
    .select("id,order_number,status,product_name,strength,quantity,order_total,deposit_status,balance_status,customer_name,customer_company,created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "list_failed" });
  res.status(200).json({ orders: data });
}
