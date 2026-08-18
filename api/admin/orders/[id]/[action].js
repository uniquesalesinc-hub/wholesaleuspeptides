import { getSupabaseAdmin } from "../../../_lib/supabaseAdmin.js";
import { verifyAdmin } from "../../../_lib/verifyAdmin.js";
import { sendOrderEmail } from "../../../_lib/resend.js";
import { ACTIONS } from "../../../../src/lib/orderStatus.js";
import { splitDeposit } from "../../../../src/lib/pricing.js";

// Single dispatch point for every admin order action (approve-quote,
// mark-deposit-paid, start-production, ...). The ACTIONS table in
// src/lib/orderStatus.js is the single source of truth for which status
// an order must currently be in for a given action, and which status it
// moves to — an order literally cannot be transitioned out of order
// through this endpoint, regardless of what the client sends.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { user, error: authError } = await verifyAdmin(req);
  if (authError) return res.status(401).json({ error: authError });

  const { id, action } = req.query;
  const def = ACTIONS[action];
  if (!def) return res.status(404).json({ error: "unknown_action" });

  const body = req.body || {};
  const supabase = getSupabaseAdmin();

  const { data: order, error: fetchError } = await supabase.from("custom_orders").select("*").eq("id", id).maybeSingle();
  if (fetchError || !order) return res.status(404).json({ error: "order_not_found" });

  if (order.status !== def.fromStatus) {
    return res.status(409).json({
      error: "invalid_transition",
      message: `Order is ${order.status}; this action requires ${def.fromStatus}.`,
    });
  }

  let patch = {};

  if (action === "approve-quote") {
    // Testing pricing isn't defined anywhere in the codebase — if the
    // customer selected any testing, the admin must confirm a fee here
    // before the order (and therefore its deposit/balance) can total out.
    // Flagged explicitly rather than inventing a number.
    let testingPrice = order.testing_price;
    if (order.testing_option !== "none" && testingPrice == null) {
      if (body.testingPrice == null || body.testingPrice === "") {
        return res.status(400).json({ error: "testing_price_required" });
      }
      testingPrice = Number(body.testingPrice);
      if (!Number.isFinite(testingPrice) || testingPrice < 0) {
        return res.status(400).json({ error: "invalid_testing_price" });
      }
    }
    const orderTotal = Math.round((Number(order.order_subtotal || 0) + Number(testingPrice || 0)) * 100) / 100;
    const { deposit, remaining } = splitDeposit(orderTotal);
    patch = {
      testing_price: testingPrice,
      order_total: orderTotal,
      deposit_amount: deposit,
      balance_amount: remaining,
    };
  }

  if (action === "mark-deposit-paid") {
    patch = { deposit_status: "PAID", deposit_paid_at: new Date().toISOString() };
  }

  if (action === "mark-balance-paid") {
    patch = { balance_status: "PAID", balance_paid_at: new Date().toISOString() };
  }

  if (action === "mark-shipped") {
    if (!body.trackingNumber) return res.status(400).json({ error: "tracking_number_required" });
    patch = {
      tracking_carrier: body.carrier || null,
      tracking_number: body.trackingNumber,
      shipped_at: new Date().toISOString(),
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("custom_orders")
    .update({ status: def.toStatus, ...patch })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("order update failed:", updateError);
    return res.status(500).json({ error: "update_failed" });
  }

  await supabase.from("custom_order_events").insert({
    order_id: id,
    from_status: order.status,
    to_status: def.toStatus,
    note: def.logNote || null,
    created_by: user.id,
  });

  if (def.emailEvent) {
    try {
      await sendOrderEmail(def.emailEvent, updated);
    } catch (err) {
      console.error("Resend send failed:", err);
    }
  }

  res.status(200).json({ order: updated });
}
