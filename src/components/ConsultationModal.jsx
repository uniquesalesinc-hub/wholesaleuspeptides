import { useState, useEffect } from "react";
import { trackEvent } from "../lib/analytics";

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
    intro: "This strength is available through our custom production program and is not maintained as ready-to-ship inventory. Production lead time, testing requirements, and quantity must be confirmed with our wholesale team before the order is accepted. Once approved, a 50% deposit (ACH or Zelle) is required to begin production, with the remaining 50% due before shipment.",
  },
  large_volume: {
    eyebrow: "Large-Volume Order",
    title: "Request Large-Volume Order",
    subject: "New Large-Volume Order Request",
    intro: "Orders of 300+ units per SKU require confirmation from our wholesale team before they can be accepted — including lead time, inventory/production availability, payment, testing expectations, packaging/labeling, shipping, and delivery expectations.",
  },
};

async function submitConsultationRequest(type, context, form) {
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
        requested_quantity: context.qty,
        name: form.name,
        company: form.company,
        business_email: form.email,
        phone: form.phone || "Not provided",
        message: form.message || "Not provided",
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

  useEffect(() => {
    if (open) { setForm(EMPTY_FORM); setSent(false); }
  }, [open]);

  if (!open || !context) return null;
  const meta = TYPE_META[context.type] || TYPE_META.custom_production;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = form.name.trim() && form.company.trim() && emailValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await submitConsultationRequest(context.type, context, form);
    setSubmitting(false);
    setSent(true);
    trackEvent(context.type === "custom_production" ? "custom_production_requested" : "large_volume_order_requested", {
      product: context.productName, strength: context.strength, qty: context.qty,
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
              <div style={{ background: OFF, border: "1px solid " + MIST, padding: "12px 14px", marginBottom: 18 }}>
                <div style={{ fontSize: 9, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Your Request</div>
                {[["Product", context.productName], ["Strength", context.strength], ["Requested Quantity", context.qty]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                    <span style={{ color: STONE }}>{k}</span>
                    <span style={{ fontWeight: 700, color: NAVY }}>{v}</span>
                  </div>
                ))}
              </div>
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
            <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8 }}>
              Thank you. Our wholesale team will follow up with you regarding {context.productName} {context.strength} ({context.qty} units) shortly.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
