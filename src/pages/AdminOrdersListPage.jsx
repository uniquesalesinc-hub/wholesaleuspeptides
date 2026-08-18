import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { listOrders } from "../lib/adminApi";
import { STATUS_LABELS } from "../lib/orderStatus";

const NAVY = "#05111F", GOLD = "#C9A84C", STONE = "#8A8680", MIST = "#D4CFC6", OFF = "#F7F6F3";
const fmt = (n) => (n != null ? "$" + Number(n).toFixed(2) : "—");

export default function AdminOrdersListPage() {
  const [session, setSession] = useState(undefined);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) { setError("Admin authentication is not configured."); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { window.location.href = "/admin/login"; return; }
    listOrders().then((d) => setOrders(d.orders)).catch((e) => setError(e.message));
  }, [session]);

  if (!supabase || error) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: "#8B2E2E" }}>{error}</div>;
  }
  if (session === undefined || (session && orders === null)) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: STONE }}>Loading…</div>;
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: OFF }}>
      <div style={{ background: NAVY, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: GOLD, textTransform: "uppercase", fontWeight: 700 }}>Admin</div>
          <div style={{ fontSize: 20, color: "#fff", fontFamily: "Georgia,serif", fontWeight: 800 }}>Custom Production Orders</div>
        </div>
        <button
          onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/admin/login"))}
          style={{ background: "none", border: "1px solid rgba(201,168,76,0.4)", color: GOLD, padding: "8px 16px", fontSize: 10, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>
          Sign Out
        </button>
      </div>
      <div style={{ padding: 32, overflowX: "auto" }}>
        {error && <div style={{ color: "#8B2E2E", marginBottom: 16 }}>{error}</div>}
        {orders && orders.length === 0 && <div style={{ color: STONE }}>No custom production orders yet.</div>}
        {orders && orders.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: 12, minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid " + MIST }}>
                {["Order #", "Customer", "Product", "Qty", "Status", "Total", "Deposit", "Balance", "Created"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", color: STONE }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => (window.location.href = `/admin/orders/${o.id}`)} style={{ borderBottom: "1px solid " + MIST, cursor: "pointer" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: NAVY }}>{o.order_number}</td>
                  <td style={{ padding: "10px 12px" }}>{o.customer_company}</td>
                  <td style={{ padding: "10px 12px" }}>{o.product_name} — {o.strength}</td>
                  <td style={{ padding: "10px 12px" }}>{o.quantity}</td>
                  <td style={{ padding: "10px 12px" }}>{STATUS_LABELS[o.status] || o.status}</td>
                  <td style={{ padding: "10px 12px" }}>{fmt(o.order_total)}</td>
                  <td style={{ padding: "10px 12px" }}>{o.deposit_status}</td>
                  <td style={{ padding: "10px 12px" }}>{o.balance_status}</td>
                  <td style={{ padding: "10px 12px", color: STONE }}>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
