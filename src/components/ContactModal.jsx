import { useState } from "react";
import { trackEvent } from "../lib/analytics";

const NAVY = "#05111F";
const GOLD = "#C9A84C";
const STONE = "#8A8680";
const MIST = "#D4CFC6";

// Web3Forms access key. Replace VITE_WEB3FORMS_ACCESS_KEY in your environment
// (.env / Vercel project settings) with a real key registered to
// support@wholesaleuspeptides.com before launch — see .env.example.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

async function submitContactMessage(msg) {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New Contact Form Message",
        from_name: "WholesaleUSPeptides.com — Contact Form",
        email: "support@wholesaleuspeptides.com",
        name: msg.name,
        reply_to: msg.email,
        message: msg.message,
      }),
    });
  } catch (err) {
    // Best-effort delivery — confirmation shows regardless so a visitor's
    // submission is never blocked by an email-delivery failure.
    console.error("Contact message submission failed:", err);
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

export default function ContactModal({ open, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = form.name.trim() && emailValid && form.message.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await submitContactMessage(form);
    setSubmitting(false);
    setSent(true);
    trackEvent("contact_form_submitted");
  };

  const handleClose = () => {
    onClose();
    setForm({ name: "", email: "", message: "" });
    setSent(false);
  };

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(3,13,24,0.72)", zIndex: 950 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "92%", maxWidth: 440, maxHeight: "88vh", overflowY: "auto", background: "#fff", zIndex: 960, fontFamily: "'Inter',sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ background: NAVY, padding: "20px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid " + GOLD }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
              {sent ? "Message Sent" : "Contact Us"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif", lineHeight: 1.3 }}>
              {sent ? "We'll Be In Touch" : "Get In Touch"}
            </div>
          </div>
          <button onClick={handleClose} style={{ background: "none", border: "none", fontSize: 22, color: "rgba(255,255,255,0.4)", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "24px 26px 28px" }}>
          {!sent ? (
            <>
              <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8, marginBottom: 20 }}>
                Questions about wholesale pricing, white label programs, or batch documentation? Send us a message.
              </p>
              <Field label="Full Name">
                <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Email">
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
              </Field>
              <Field label="Message">
                <textarea style={{ ...inputStyle, height: 90, resize: "vertical" }} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help?" />
              </Field>
              <button onClick={handleSubmit} disabled={!canSubmit} className="btn-polish"
                style={{ width: "100%", marginTop: 8, padding: "13px 0", background: canSubmit ? GOLD : "#D8D2C6", border: "none", color: NAVY, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </>
          ) : (
            <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8 }}>
              Thank you. Our wholesale team typically responds within 1 business day.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
