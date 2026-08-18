import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { sendOrderEmail } from "../_lib/resend.js";

// Public endpoint — called from ConsultationModal's "Request Custom
// Production" submit. No admin auth required to create a request (same
// trust level as the existing Web3Forms lead-capture flow this runs
// alongside), but every subsequent action on the order requires an
// authenticated admin.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const b = req.body || {};
  const required = ["productName", "strength", "quantity", "testingOption", "customerName", "customerCompany", "customerEmail"];
  for (const field of required) {
    if (!b[field]) return res.status(400).json({ error: "missing_field", field });
  }

  const quantity = Number(b.quantity);
  if (!Number.isFinite(quantity) || quantity < 100) {
    return res.status(400).json({ error: "invalid_quantity" });
  }
  if (!["none", "standard", "standard_sterility"].includes(b.testingOption)) {
    return res.status(400).json({ error: "invalid_testing_option" });
  }

  // Client-submitted estimate only, same resolveTier/unitPriceFor math the
  // catalog and this modal's own "Estimated Pricing" already use. Never
  // treated as final — the wholesale team confirms real pricing (and any
  // testing fee) at Approve Quote time.
  const unitPrice = b.unitPrice != null ? Number(b.unitPrice) : null;
  const orderSubtotal = unitPrice != null ? Math.round(unitPrice * quantity * 100) / 100 : null;

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("custom_orders")
    .insert({
      product_name: b.productName,
      strength: b.strength,
      quantity,
      unit_price: unitPrice,
      order_subtotal: orderSubtotal,
      testing_option: b.testingOption,
      customer_name: b.customerName,
      customer_company: b.customerCompany,
      customer_email: b.customerEmail,
      customer_phone: b.customerPhone || null,
      customer_message: b.customerMessage || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("custom_orders insert failed:", error);
    return res.status(500).json({ error: "create_failed" });
  }

  await supabase.from("custom_order_events").insert({
    order_id: order.id,
    to_status: "REQUEST_SUBMITTED",
  });

  try {
    await sendOrderEmail("request_received", order);
  } catch (err) {
    // Best-effort — matches the site's existing Web3Forms pattern. The
    // order is already persisted and Web3Forms already notified the team
    // as a redundant channel, so a Resend hiccup never blocks the
    // customer's confirmation.
    console.error("Resend send failed:", err);
  }

  res.status(201).json({ orderNumber: order.order_number, accessToken: order.access_token });
}
