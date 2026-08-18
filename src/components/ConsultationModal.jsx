import { useState, useEffect } from "react";
import { trackEvent } from "../lib/analytics";
import { DEFAULT_MIN_QTY, CUSTOM_PRODUCTION_MIN_QTY, resolveTier, hasPrice, fmt, splitDeposit } from "../lib/pricing";

const NAVY = "#05111F";
const GOLD = "#C9A84C";
const STONE = "#8A8680";
const MIST = "#D4CFC6";
const OFF = "#F7F6F3";

// Web3Forms access key. Replace VITE_WEB3FORMS_ACCESS_KEY in your environment
// (.env / Vercel project settings) with a real key registered to
// support@wholesaleuspeptides.com before launch — see .env.example.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

const TYPE_META = {
  custom_production: {
    eyebrow: "Custom Production",
    title: "Request Custom Production",
    subject: "New Custom Production Request",
    intro: "Custom Production orders require a 100-unit minimum per SKU — our compounders do not manufacture below this volume. Production lead time is 10–14 business days. A 50% deposit is required to begin production, with the remaining 50% due upon completion, prior to shipping. Shipping takes 2–3 business days after final payment.",
  },
  large_volume: {
    eyebrow: "Large-Volume Order",
    title: "Request Large-Volume Order",
    subject: "New Large-Volume Order Request",
    intro: "Orders of 300+ units per SKU require confirmation from our wholesale team before they can be accepted — including lead time, inventory/production availability, payment, testing expectations, packaging/labeling, shipping, and delivery expectations.",
  },
};

const TESTING_OPTIONS = {
  none: "No additional testing",
  standard: "Standard third-party testing — results typically 2–3 business days",
  standard_sterility: "Standard testing + sterility — sterility results approximately 14 days",
};

// Persists the request as a real order record (Supabase, via our own API)
// so it can be tracked through the Custom Production status workflow.
// Best-effort: a failure here never blocks the customer's confirmation,
// since submitConsultationRequest's Web3Forms email already notifies the
// wholesale team as a redundant channel.
async function createCustomOrder(context, form, qty, testing, pricing) {
  try {
    const res = await fetch("/api/custom-orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: context.productName,
        strength: context.strength,
        quantity: qty,
        testingOption: testing,
        unitPrice: pricing ? pricing.unitPrice : null,
        customerName: form.name,
        customerCompany: form.company,
        customerEmail: form.email,
        customerPhone: form.phone || null,
        customerMessage: form.message || null,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Custom order creation failed:", err);
    return null;
  }
}

async function submitConsultationRequest(type, context, form, qty, pricing, testing) {
  const meta = TYPE_META[type] || TYPE_META.custom_production;
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: meta.subject,
        from_name: "WholesaleUSPeptides.com — " + meta.title,
        email: "support@wholesaleuspeptides.com",
        request_type: meta.subject,
        product: context.productName,
        strength: context.strength,
        requested_quantity: qty,
        name: form.name,
        company: form.company,
        business_email: form.email,
        phone: form.phone || "Not provided",
        message: form.message || "Not provided",
        // Estimate only — pricing.js's resolveTier() against the product's
        // existing tier data, same logic the catalog/cart use. Final pricing
        // is confirmed by the wholesale team before the order is accepted.
        ...(pricing ? {
          estimated_unit_price: fmt(pricing.unitPrice),
          estimated_order_total: fmt(pricing.orderTotal),
          estimated_deposit: fmt(pricing.deposit),
          estimated_remaining_balance: fmt(pricing.remaining),
        } : {}),
        ...(type === "custom_production" ? { testing_option: TESTING_OPTIONS[testing] } : {}),
      }),
    });
  } catch (err) {
    // Best-effort delivery — confirmation shows regardless so a visitor's
    // submission is never blocked by an email-delivery failure.
    console.error("Consultation request submission failed:", err);
  }
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid " + MIST,
  background: "#fff",
  fontSize: 13,
  color: NAVY,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Inter',sans-serif",
};

const EMPTY_FORM = { name: "", company: "", email: "", phone: "", message: "" };

export default function ConsultationModal({ open, onClose, context }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [qty, setQty] = useState(DEFAULT_MIN_QTY);
  const [testing, setTesting] = useState("none");
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM); setSent(false); setTesting("none"); setOrderResult(null);
      const floor = context?.type === "custom_production" ? CUSTOM_PRODUCTION_MIN_QTY : DEFAULT_MIN_QTY;
      setQty(context?.qty || floor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !context) return null;
  const meta = TYPE_META[context.type] || TYPE_META.custom_production;
  const isCustomProduction = context.type === "custom_production";

  // Estimate only — same tier-resolution logic the catalog/cart use against
  // the product's existing pricing data. No new pricing is introduced here.
  let pricing = null;
  if (isCustomProduction && context.variant) {
    const tier = resolveTier(context.variant, qty);
    const unitPrice = context.variant[tier] || 0;
    if (hasPrice(unitPrice)) {
      const orderTotal = unitPrice * qty;
      const { deposit, remaining } = splitDeposit(orderTotal);
      pricing = { unitPrice, orderTotal, deposit, remaining };
    }
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const qtyFloor = isCustomProduction ? CUSTOM_PRODUCTION_MIN_QTY : DEFAULT_MIN_QTY;
  const setQtyClamped = (v) => setQty(Math.max(qtyFloor, parseInt(v, 10) || qtyFloor));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = form.name.trim() && form.company.trim() && emailValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await submitConsultationRequest(context.type, context, form, qty, pricing, testing);
    if (isCustomProduction) {
      const created = await createCustomOrder(context, form, qty, testing, pricing);
      if (created) setOrderResult(created);
    }
    setSubmitting(false);
    setSent(true);
    trackEvent(context.type === "custom_production" ? "custom_production_requested" : "large_volume_order_requested", {
      product: context.productName, strength: context.strength, qty, ...(isCustomProduction ? { testing } : {}),
    });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,13,24,0.72)", zIndex: 950 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "92%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", background: "#fff", zIndex: 960, fontFamily: "'Inter',sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ background: NAVY, padding: "20px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid " + GOLD }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
              {sent ? "Request Received" : meta.eyebrow}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif", lineHeight: 1.3 }}>
              {sent ? "Thank You" : meta.title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "rgba(255,255,255,0.4)", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "24px 26px 28px" }}>
          {!sent ? (
            <>
              <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8, marginBottom: 16 }}>{meta.intro}</p>
              <div style={{ background: OFF, border: "1px solid " + MIST, padding: "12px 14px", marginBottom: isCustomProduction ? 12 : 18 }}>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Your Request</div>
                {[["Product", context.productName], ["Strength", context.strength]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                    <span style={{ color: STONE }}>{k}</span>
                    <span style={{ fontWeight: 700, color: NAVY }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, padding: "3px 0" }}>
                  <span style={{ color: STONE }}>Requested Quantity</span>
                  {isCustomProduction ? (
                    <input type="number" min={CUSTOM_PRODUCTION_MIN_QTY} value={qty} onChange={(e) => setQtyClamped(e.target.value)}
                      style={{ width: 70, padding: "4px 6px", border: "1px solid " + MIST, background: "#fff", fontSize: 11, fontWeight: 700, color: NAVY, textAlign: "right", outline: "none" }} />
                  ) : (
                    <span style={{ fontWeight: 700, color: NAVY }}>{context.qty}</span>
                  )}
                </div>
                {isCustomProduction && (
                  <div style={{ fontSize: 8.5, color: STONE, textAlign: "right", marginTop: 2 }}>100-unit minimum per SKU</div>
                )}
              </div>
              {isCustomProduction && (
                <div style={{ background: OFF, border: "1px solid " + MIST, padding: "12px 14px", marginBottom: 18 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Laboratory Testing (Optional)</div>
                  <p style={{ fontSize: 10.5, color: STONE, lineHeight: 1.6, marginBottom: 10 }}>
                    Laboratory testing and a Certificate of Analysis (COA) are not automatically included with Custom Production orders. Third-party testing may be purchased separately.
                  </p>
                  <select value={testing} onChange={(e) => setTesting(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {Object.entries(TESTING_OPTIONS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {testing !== "none" && (
                    <p style={{ fontSize: 9.5, color: STONE, lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>
                      Standard testing includes: Purity, Content, Heavy Metals, Endotoxins.
                    </p>
                  )}
                  {testing === "standard_sterility" && (
                    <p style={{ fontSize: 9.5, color: STONE, lineHeight: 1.6, marginTop: 6, marginBottom: 0 }}>
                      Sterility testing may extend your overall production and fulfillment timeline beyond the standard 10–14 business day lead time.
                    </p>
                  )}
                  {testing !== "none" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 10, paddingTop: 10, borderTop: "1px solid " + MIST }}>
                      <span style={{ color: STONE }}>Testing Fee</span>
                      <span style={{ fontWeight: 700, color: NAVY }}>Price confirmed after request</span>
                    </div>
                  )}
                </div>
              )}
              {isCustomProduction && (
                <div style={{ background: OFF, border: "1px solid " + MIST, padding: "12px 14px", marginBottom: 18 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Estimated Pricing</div>
                  {pricing ? (
                    <>
                      {[
                        ["Estimated Unit Price", fmt(pricing.unitPrice)],
                        ["Estimated Order Total", fmt(pricing.orderTotal)],
                        ["Estimated 50% Deposit", fmt(pricing.deposit)],
                        ["Estimated Remaining Balance", fmt(pricing.remaining)],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                          <span style={{ color: STONE }}>{k}</span>
                          <span style={{ fontWeight: 700, color: NAVY }}>{v}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: STONE }}>Pricing Available Upon Request</div>
                  )}
                  <p style={{ fontSize: 9.5, color: STONE, lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>
                    Estimate only. Final pricing, lead time, testing requirements, and availability are confirmed by our wholesale team before the order is accepted.
                  </p>
                </div>
              )}
              <Field label="Full Name">
                <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Company Name">
                <input style={inputStyle} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Apex Wellness LLC" />
              </Field>
              <Field label="Business Email">
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
              </Field>
              <Field label="Phone">
                <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Include country code" />
              </Field>
              <Field label="Additional Message (Optional)">
                <textarea style={{ ...inputStyle, height: 64, resize: "vertical" }} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Anything else we should know?" />
              </Field>
              <button onClick={handleSubmit} disabled={!canSubmit} className="btn-polish"
                style={{ width: "100%", marginTop: 8, padding: "13px 0", background: canSubmit ? GOLD : "#D8D2C6", border: "none", color: NAVY, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {submitting ? "Submitting..." : meta.title}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8 }}>
                Thank you. Our wholesale team will follow up with you regarding {context.productName} {context.strength} ({isCustomProduction ? qty : context.qty} units{isCustomProduction ? `, ${TESTING_OPTIONS[testing]}` : ""}) shortly.
              </p>
              {orderResult && (
                <div style={{ background: OFF, border: "1px solid " + MIST, padding: "12px 14px", marginTop: 14 }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Your Order Number</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 8 }}>{orderResult.orderNumber}</div>
                  <a href={`/order/${orderResult.accessToken}`} style={{ fontSize: 11, color: NAVY, fontWeight: 700, textDecoration: "underline" }}>
                    Track your order status →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
