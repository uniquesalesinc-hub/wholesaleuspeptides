import { useState } from "react";
import { trackEvent } from "../lib/analytics";

const NAVY = "#05111F";
const GOLD = "#C9A84C";
const STONE = "#8A8680";
const MIST = "#D4CFC6";

const VOLUME_TIERS = [
  "10-25 units",
  "25-50 units",
  "50-100 units",
  "100-250 units",
  "250-500 units",
  "500+ units",
];

// Web3Forms access key. Replace VITE_WEB3FORMS_ACCESS_KEY in your environment
// (.env / Vercel project settings) with a real key registered to
// support@wholesaleuspeptides.com before launch — see .env.example.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

async function submitQuoteRequest(form) {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New Manufacturing Quote Request",
        from_name: "WholesaleUSPeptides.com — Request a Quote",
        email: "support@wholesaleuspeptides.com",
        name: form.name,
        company: form.company,
        business_email: form.email,
        phone: form.phone || "Not provided",
        products_of_interest: form.products,
        estimated_monthly_volume: form.volume,
        notes: form.notes || "Not provided",
      }),
    });
  } catch (err) {
    // Best-effort delivery — confirmation shows regardless so a visitor's
    // submission is never blocked by an email-delivery failure.
    console.error("Quote request submission failed:", err);
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

const EMPTY_FORM = { name: "", company: "", email: "", phone: "", products: "", volume: "", notes: "" };

export default function QuoteRequestModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = form.name.trim() && form.company.trim() && emailValid && form.products.trim() && form.volume && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await submitQuoteRequest(form);
    setSubmitting(false);
    setSent(true);
    trackEvent("quote_requested");
  };

  const handleClose = () => {
    onClose();
    setForm(EMPTY_FORM);
    setSent(false);
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(3,13,24,0.72)", zIndex: 950 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "92%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", background: "#fff", zIndex: 960, fontFamily: "'Inter',sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ background: NAVY, padding: "20px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid " + GOLD }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
              {sent ? "Request Received" : "Manufacturing Quote"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif", lineHeight: 1.3 }}>
              {sent ? "Thank You" : "Request a Manufacturing Quote"}
            </div>
          </div>
          <button onClick={handleClose} style={{ background: "none", border: "none", fontSize: 22, color: "rgba(255,255,255,0.4)", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "24px 26px 28px" }}>
          {!sent ? (
            <>
              <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8, marginBottom: 20 }}>
                Tell us about your manufacturing needs and a specialist will follow up with pricing and lead times.
              </p>
              <Field label="Full Name">
                <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Company Name">
                <input style={inputStyle} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Apex Labs LLC" />
              </Field>
              <Field label="Business Email">
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
              </Field>
              <Field label="Phone">
                <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Include country code" />
              </Field>
              <Field label="Product(s) of Interest">
                <textarea style={{ ...inputStyle, height: 64, resize: "vertical" }} value={form.products} onChange={(e) => set("products", e.target.value)} placeholder="e.g. BPC-157, TB-500, Ipamorelin" />
              </Field>
              <Field label="Estimated Monthly Volume">
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.volume} onChange={(e) => set("volume", e.target.value)}>
                  <option value="">Select volume...</option>
                  {VOLUME_TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Additional Notes (Optional)">
                <textarea style={{ ...inputStyle, height: 64, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything else we should know?" />
              </Field>
              <button onClick={handleSubmit} disabled={!canSubmit} className="btn-polish"
                style={{ width: "100%", marginTop: 8, padding: "13px 0", background: canSubmit ? GOLD : "#D8D2C6", border: "none", color: NAVY, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {submitting ? "Submitting..." : "Submit Quote Request"}
              </button>
            </>
          ) : (
            <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8 }}>
              Thank you. A manufacturing specialist will contact you within 48 hours.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
