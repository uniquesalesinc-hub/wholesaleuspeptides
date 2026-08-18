import { Resend } from "resend";

const SITE_URL = "https://wholesaleuspeptides.com";

const money = (n) => (n != null ? "$" + Number(n).toFixed(2) : "TBD");

function baseWrap(title, bodyHtml, order) {
  return `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;">
      <div style="background:#05111F;padding:24px 28px;border-bottom:3px solid #C9A84C;">
        <div style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">WholesaleUSPeptides.com</div>
        <div style="color:#fff;font-size:20px;font-weight:700;margin-top:6px;">${title}</div>
      </div>
      <div style="padding:24px 28px;font-family:Arial,sans-serif;color:#333;font-size:14px;line-height:1.6;">
        ${bodyHtml}
        <table style="width:100%;margin-top:20px;border-collapse:collapse;font-size:13px;">
          <tr><td style="padding:4px 0;color:#8A8680;">Order Number</td><td style="padding:4px 0;text-align:right;font-weight:700;">${order.order_number}</td></tr>
          <tr><td style="padding:4px 0;color:#8A8680;">Product</td><td style="padding:4px 0;text-align:right;">${order.product_name} — ${order.strength}</td></tr>
          <tr><td style="padding:4px 0;color:#8A8680;">Quantity</td><td style="padding:4px 0;text-align:right;">${order.quantity} units</td></tr>
          <tr><td style="padding:4px 0;color:#8A8680;">Order Total</td><td style="padding:4px 0;text-align:right;">${money(order.order_total)}</td></tr>
        </table>
        <div style="margin-top:24px;">
          <a href="${SITE_URL}/order/${order.access_token}" style="display:inline-block;background:#C9A84C;color:#05111F;padding:12px 22px;text-decoration:none;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;">View Order Status</a>
        </div>
      </div>
    </div>`;
}

const TEMPLATES = {
  request_received: (order) => ({
    subject: `Custom Production Request Received — ${order.order_number}`,
    html: baseWrap(
      "Request Received",
      `<p>Thank you for your Custom Production request. Our wholesale team is reviewing it and will follow up with a confirmed quote.</p>`,
      order
    ),
  }),
  deposit_due: (order) => ({
    subject: `Quote Approved — Deposit Due — ${order.order_number}`,
    html: baseWrap(
      "Quote Approved",
      `<p>Your Custom Production quote has been approved. A 50% deposit is required to begin production.</p>
       <table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:13px;">
         <tr><td style="padding:4px 0;color:#8A8680;">Deposit Due</td><td style="padding:4px 0;text-align:right;font-weight:700;">${money(order.deposit_amount)}</td></tr>
         <tr><td style="padding:4px 0;color:#8A8680;">Balance Due Upon Completion</td><td style="padding:4px 0;text-align:right;">${money(order.balance_amount)}</td></tr>
       </table>
       <p style="margin-top:14px;">Please contact our wholesale team to arrange your deposit via ACH or Zelle.</p>`,
      order
    ),
  }),
  deposit_received: (order) => ({
    subject: `Deposit Received — ${order.order_number}`,
    html: baseWrap(
      "Deposit Received",
      `<p>We've received your deposit. Your order is now queued for production.</p><p>Production lead time is typically 10–14 business days.</p>`,
      order
    ),
  }),
  production_started: (order) => ({
    subject: `Production Started — ${order.order_number}`,
    html: baseWrap("Production Started", `<p>Your Custom Production order is now in production.</p>`, order),
  }),
  balance_due: (order) => ({
    subject: `Production Complete — Balance Due — ${order.order_number}`,
    html: baseWrap(
      "Production Complete",
      `<p>Your custom production order is complete.</p>
       <p>The remaining balance is now due. Once final payment is received, your order will be prepared for shipment.</p>
       <p>Shipping typically takes 2–3 business days after final payment.</p>
       <table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:13px;">
         <tr><td style="padding:4px 0;color:#8A8680;">Deposit Paid</td><td style="padding:4px 0;text-align:right;">${money(order.deposit_amount)}</td></tr>
         <tr><td style="padding:4px 0;color:#8A8680;">Remaining Balance</td><td style="padding:4px 0;text-align:right;font-weight:700;">${money(order.balance_amount)}</td></tr>
       </table>
       <p style="margin-top:14px;">Please contact our wholesale team to arrange final payment.</p>`,
      order
    ),
  }),
  final_payment_received: (order) => ({
    subject: `Final Payment Received — ${order.order_number}`,
    html: baseWrap("Paid in Full", `<p>Final payment has been received. Your order is being prepared for shipment.</p>`, order),
  }),
  order_shipped: (order) => ({
    subject: `Your Order Has Shipped — ${order.order_number}`,
    html: baseWrap(
      "Order Shipped",
      `<p>Your Custom Production order has shipped.</p>
       <table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:13px;">
         <tr><td style="padding:4px 0;color:#8A8680;">Carrier</td><td style="padding:4px 0;text-align:right;">${order.tracking_carrier || "—"}</td></tr>
         <tr><td style="padding:4px 0;color:#8A8680;">Tracking Number</td><td style="padding:4px 0;text-align:right;font-weight:700;">${order.tracking_number || "—"}</td></tr>
       </table>`,
      order
    ),
  }),
};

// One dispatcher for every notification the order workflow fires. Kept as
// a single "channels" entry point (sendEmail today) so an sendSms channel
// can be added later without restructuring call sites — SMS is out of
// scope for Phase 1 but this shouldn't need rework to add it.
export async function sendOrderEmail(eventKey, order) {
  const tmpl = TEMPLATES[eventKey];
  if (!tmpl) throw new Error(`Unknown email event: ${eventKey}`);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, html } = tmpl(order);
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: order.customer_email,
    subject,
    html,
  });
}
