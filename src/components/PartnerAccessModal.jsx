import { useState } from "react";
import { trackEvent } from "../lib/analytics";

const NAVY = "#05111F";
const GOLD = "#C9A84C";
const STONE = "#8A8680";
const MIST = "#D4CFC6";
const OFF = "#F7F6F3";

const BUSINESS_TYPES = [
  "Research Organization",
  "Distribution Partner",
  "Professional Organization",
  "Wellness Brand",
  "Private Label Brand",
  "Qualified Business",
  "Other",
];

// Web3Forms access key. Replace VITE_WEB3FORMS_ACCESS_KEY in your environment
// (.env / Vercel project settings) with a real key registered to
// support@wholesaleuspeptides.com before launch — see .env.example.
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

async function submitPartnerLead(lead) {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: "New Wholesale Partner Access Request",
        from_name: "WholesaleUSPeptides.com — Partner Access",
        email: "support@wholesaleuspeptides.com",
        name: lead.name,
        company: lead.company,
        business_email: lead.email,
        phone: lead.phone || "Not provided",
        business_type: lead.businessType,
      }),
    });
  } catch (err) {
    // Best-effort delivery — the unlock proceeds regardless so a visitor's
    // access is never blocked by an email-delivery failure.
    console.error("Partner lead submission failed:", err);
  }
}

const RESOURCES = [
  { label: "Volume Pricing Tiers", desc: "Full volume-based wholesale pricing is now visible on every product card.", action: "catalog" },
  { label: "2026 Wholesale Catalog", desc: "Download the current category and starting-price overview.", href: "/downloads/2026-wholesale-catalog.pdf" },
  { label: "White Label Resources", desc: "Private label program details, formats, and onboarding steps.", action: "wl" },
  { label: "Manufacturing Standards", desc: "Domestic manufacturing and third-party testing standards.", action: "about" },
  { label: "Batch Verification Resources", desc: "COA lookup and lot-specific lab documentation.", action: "coa" },
  { label: "Partner Documents", desc: "Request signed partner agreements and onboarding paperwork.", mailto: "mailto:support@wholesaleuspeptides.com?subject=Partner%20Documents%20Request" },
];

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

export default function PartnerAccessModal({ open, onClose, unlocked, onUnlock, setPage }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", businessType: "" });
  const [submitting, setSubmitting] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const canSubmit = form.name.trim() && form.company.trim() && emailValid && form.businessType && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await submitPartnerLead(form);
    onUnlock(form);
    setSubmitting(false);
    setJustUnlocked(true);
    trackEvent("partner_access_unlocked", { business_type: form.businessType });
  };

  const goTo = (id) => {
    if (id && setPage) setPage(id);
    onClose();
  };

  const showResources = unlocked || justUnlocked;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,13,24,0.72)", zIndex: 950 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "92%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", background: "#fff", zIndex: 960, fontFamily: "'Inter',sans-serif", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ background: NAVY, padding: "20px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid " + GOLD }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
              {showResources ? "Access Granted" : "Partner Access"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Georgia,serif", lineHeight: 1.3 }}>
              {showResources ? "Your Partner Resources" : "Unlock Partner Pricing & Resources"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "rgba(255,255,255,0.4)", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "24px 26px 28px" }}>
          {!showResources && (
            <>
              <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8, marginBottom: 20 }}>
                Access volume pricing, downloadable catalogs, manufacturing resources, and partner materials.
              </p>
              <Field label="Full Name">
                <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Company Name">
                <input style={inputStyle} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Apex Wellness LLC" />
              </Field>
              <Field label="Business Email">
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
              </Field>
              <Field label="Phone (Optional)">
                <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Include country code" />
              </Field>
              <Field label="Business Type">
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.businessType} onChange={(e) => set("businessType", e.target.value)}>
                  <option value="">Select business type...</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <button onClick={handleSubmit} disabled={!canSubmit} className="btn-polish"
                style={{ width: "100%", marginTop: 8, padding: "13px 0", background: canSubmit ? GOLD : "#D8D2C6", border: "none", color: NAVY, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", cursor: canSubmit ? "pointer" : "not-allowed" }}>
                {submitting ? "Submitting..." : "Unlock Partner Access"}
              </button>
              <div style={{ fontSize: 9, color: STONE, lineHeight: 1.7, textAlign: "center", marginTop: 12 }}>
                Your information is used only to verify wholesale partner status and deliver manufacturing resources.
              </div>
            </>
          )}

          {showResources && (
            <>
              <p style={{ fontSize: 12, color: STONE, lineHeight: 1.8, marginBottom: 18 }}>
                Thank you. Volume pricing and partner resources are unlocked below — access remains active on this device for future visits.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {RESOURCES.map((r) => {
                  const content = (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{r.label}</span>
                      </div>
                      <div style={{ fontSize: 10.5, color: STONE, lineHeight: 1.5 }}>{r.desc}</div>
                    </>
                  );
                  const rowStyle = { display: "block", textAlign: "left", padding: "12px 14px", background: OFF, border: "1px solid " + MIST, cursor: "pointer", textDecoration: "none" };
                  if (r.href) {
                    return <a key={r.label} href={r.href} download style={rowStyle} onClick={()=>trackEvent("catalog_download")}>{content}</a>;
                  }
                  if (r.mailto) {
                    return <a key={r.label} href={r.mailto} style={rowStyle}>{content}</a>;
                  }
                  return (
                    <button key={r.label} onClick={() => goTo(r.action)} style={{ ...rowStyle, width: "100%", font: "inherit" }}>
                      {content}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
