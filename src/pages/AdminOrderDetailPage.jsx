import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getOrder, runOrderAction } from "../lib/adminApi";
import { ACTIONS, STATUS_LABELS } from "../lib/orderStatus";

const NAVY = "#05111F", GOLD = "#C9A84C", STONE = "#8A8680", MIST = "#D4CFC6", OFF = "#F7F6F3";
const fmt = (n) => (n != null ? "$" + Number(n).toFixed(2) : "—");

function orderIdFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean); // ["admin","orders",":id"]
  return parts[2];
}

export default function AdminOrderDetailPage() {
  const [session, setSession] = useState(undefined);
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testingPriceInput, setTestingPriceInput] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const id = orderIdFromPath();

  useEffect(() => {
    if (!supabase) { setError("Admin authentication is not configured."); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = () =>
    getOrder(id)
      .then((d) => { setOrder(d.order); setEvents(d.events); })
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { window.location.href = "/admin/login"; return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const doAction = async (action, body) => {
    setBusy(true);
    setError("");
    try {
      await runOrderAction(id, action, body);
      setTestingPriceInput("");
      setCarrier("");
      setTrackingNumber("");
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (!supabase || (error && !order)) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: "#8B2E2E" }}>{error}</div>;
  }
  if (session === undefined || (!order && !error)) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: STONE }}>Loading…</div>;
  }

  const availableActions = Object.entries(ACTIONS).filter(([, def]) => def.fromStatus === order.status);
  const needsTestingPrice = order.status === "REQUEST_SUBMITTED" && order.testing_option !== "none" && order.testing_price == null;

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: OFF }}>
      <div style={{ background: NAVY, padding: "24px 32px" }}>
        <a href="/admin/orders" style={{ color: GOLD, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, textDecoration: "none" }}>← All Orders</a>
        <div style={{ fontSize: 22, color: "#fff", fontFamily: "Georgia,serif", fontWeight: 800, marginTop: 8 }}>{order.order_number}</div>
        <div style={{ color: GOLD, fontSize: 12, marginTop: 4 }}>{STATUS_LABELS[order.status] || order.status}</div>
      </div>

      <div style={{ padding: 32, maxWidth: 800 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={{ background: "#fff", padding: 20, border: "1px solid " + MIST }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>Order Details</div>
            {[
              ["Product", `${order.product_name} — ${order.strength}`],
              ["Quantity", `${order.quantity} units`],
              ["Unit Price (est.)", fmt(order.unit_price)],
              ["Testing", order.testing_option],
              ["Testing Price", order.testing_price != null ? fmt(order.testing_price) : "Price confirmed after request"],
              ["Order Total", fmt(order.order_total)],
              ["Deposit", `${fmt(order.deposit_amount)} — ${order.deposit_status}`],
              ["Balance", `${fmt(order.balance_amount)} — ${order.balance_status}`],
              ["Tracking", order.tracking_number ? `${order.tracking_carrier || ""} ${order.tracking_number}`.trim() : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, borderBottom: "1px solid " + OFF }}>
                <span style={{ color: STONE }}>{k}</span>
                <span style={{ fontWeight: 600, color: NAVY, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", padding: 20, border: "1px solid " + MIST }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>Customer</div>
            {[
              ["Name", order.customer_name],
              ["Company", order.customer_company],
              ["Email", order.customer_email],
              ["Phone", order.customer_phone || "—"],
              ["Message", order.customer_message || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, borderBottom: "1px solid " + OFF }}>
                <span style={{ color: STONE }}>{k}</span>
                <span style={{ fontWeight: 600, color: NAVY, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", padding: 20, border: "1px solid " + MIST, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Actions</div>
          {error && <div style={{ color: "#8B2E2E", fontSize: 12, marginBottom: 12 }}>{error}</div>}

          {needsTestingPrice && (
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: STONE }}>Confirmed testing fee ($):</span>
              <input
                value={testingPriceInput}
                onChange={(e) => setTestingPriceInput(e.target.value)}
                placeholder="0.00"
                style={{ width: 100, padding: "6px 8px", border: "1px solid " + MIST, fontSize: 12 }}
              />
            </div>
          )}

          {order.status === "READY_TO_SHIP" && (
            <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" style={{ padding: "6px 8px", border: "1px solid " + MIST, fontSize: 12 }} />
              <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking Number" style={{ padding: "6px 8px", border: "1px solid " + MIST, fontSize: 12 }} />
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {availableActions.map(([action, def]) => {
              const blockedByTestingPrice = action === "approve-quote" && needsTestingPrice && !testingPriceInput;
              const blockedByTracking = action === "mark-shipped" && !trackingNumber;
              return (
                <button
                  key={action}
                  disabled={busy || blockedByTestingPrice || blockedByTracking}
                  onClick={() =>
                    doAction(
                      action,
                      action === "approve-quote"
                        ? { testingPrice: testingPriceInput || undefined }
                        : action === "mark-shipped"
                        ? { carrier, trackingNumber }
                        : {}
                    )
                  }
                  className="btn-polish"
                  style={{
                    padding: "10px 18px",
                    background: NAVY,
                    border: "1px solid " + NAVY,
                    color: GOLD,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    cursor: busy || blockedByTestingPrice || blockedByTracking ? "not-allowed" : "pointer",
                    opacity: blockedByTestingPrice || blockedByTracking ? 0.5 : 1,
                  }}>
                  {def.label}
                </button>
              );
            })}
            {availableActions.length === 0 && <span style={{ color: STONE, fontSize: 12 }}>No further actions — order is {STATUS_LABELS[order.status]}.</span>}
          </div>
        </div>

        <div style={{ background: "#fff", padding: 20, border: "1px solid " + MIST }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Status History</div>
          {events.map((e) => (
            <div key={e.id} style={{ fontSize: 12, padding: "5px 0", borderBottom: "1px solid " + OFF, color: STONE }}>
              {new Date(e.created_at).toLocaleString()} — {e.from_status ? `${STATUS_LABELS[e.from_status] || e.from_status} → ` : ""}
              {STATUS_LABELS[e.to_status] || e.to_status}
              {e.note ? ` (${e.note})` : ""}
            </div>
          ))}
          {events.length === 0 && <div style={{ fontSize: 12, color: STONE }}>No history yet.</div>}
        </div>
      </div>
    </div>
  );
}
