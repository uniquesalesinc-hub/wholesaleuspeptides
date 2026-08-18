import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const NAVY = "#05111F", GOLD = "#C9A84C", MIST = "#D4CFC6";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) { setError("Admin authentication is not configured."); return; }
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { setError("Invalid email or password."); return; }
    window.location.href = "/admin/orders";
  };

  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: "36px 32px", width: 360, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: GOLD, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>WholesaleUSPeptides.com</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, fontFamily: "Georgia,serif", marginBottom: 20 }}>Admin Sign In</div>
        <input type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid " + MIST, marginBottom: 12, fontSize: 13, boxSizing: "border-box" }} />
        <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid " + MIST, marginBottom: 16, fontSize: 13, boxSizing: "border-box" }} />
        {error && <div style={{ color: "#8B2E2E", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={submitting} className="btn-polish"
          style={{ width: "100%", padding: "12px 0", background: GOLD, border: "none", color: NAVY, fontWeight: 800, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer" }}>
          {submitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
