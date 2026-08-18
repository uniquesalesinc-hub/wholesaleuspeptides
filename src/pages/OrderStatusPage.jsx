import { useEffect, useState } from "react";
import { STATUS_LABELS, STATUS_CUSTOMER_MESSAGE } from "../lib/orderStatus";

const NAVY = "#05111F", GOLD = "#C9A84C", STONE = "#8A8680", MIST = "#D4CFC6", OFF = "#F7F6F3";
const fmt = (n) => (n != null ? "$" + Number(n).toFixed(2) : "—");

function tokenFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean); // ["order",":token"]
  return parts[1];
}

export default function OrderStatusPage() {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = tokenFromPath();
    fetch(`/api/custom-orders/lookup?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "not_found");
        setOrder(d.order);
      })
      .catch(() => setError("We couldn't find that order. Please check your link or contact our wholesale team."));
  }, []);

  const mailtoHref = order
    ? `mailto:support@wholesaleuspeptides.com?subject=${encodeURIComponent("Payment for Order " + order.order_number)}`
    : "#";

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh", background: OFF }}>
      <div style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontWeight: 700 }}>WholesaleUSPeptides.com</div>
        <div style={{ fontSize: 24, color: "#fff", fontFamily: "Georgia,serif", fontWeight: 800, marginTop: 8 }}>Order Status</div>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px" }}>
        {error && <div style={{ textAlign: "center", color: STONE, fontSize: 13 }}>{error}</div>}
        {order && (
          <>
            <div style={{ background: "#fff", border: "1px solid " + MIST, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, color: STONE, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Order {order.order_number}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: NAVY, fontFamily: "Georgia,serif", marginBottom: 10 }}>{STATUS_LABELS[order.status] || order.status}</div>
              <p style={{ fontSize: 13, color: STONE, lineHeight: 1.7, margin: 0 }}>{STATUS_CUSTOMER_MESSAGE[order.status] || ""}</p>
            </div>
            <div style={{ background: "#fff", border: "1px solid " + MIST, padding: 24 }}>
              {[
                ["Product", `${order.product_name} — ${order.strength}`],
                ["Quantity", `${order.quantity} units`],
                ["Order Total", fmt(order.order_total)],
                ["Deposit", `${fmt(order.deposit_amount)} — ${order.deposit_status}`],
                ["Remaining Balance", `${fmt(order.balance_amount)} — ${order.balance_status}`],
                ...(order.tracking_number ? [["Tracking", `${order.tracking_carrier || ""} ${order.tracking_number}`.trim()]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, borderBottom: "1px solid " + OFF }}>
                  <span style={{ color: STONE }}>{k}</span>
                  <span style={{ fontWeight: 600, color: NAVY }}>{v}</span>
                </div>
              ))}
            </div>
            {(order.status === "DEPOSIT_DUE" || order.status === "BALANCE_DUE") && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <a
                  href={mailtoHref}
                  className="btn-polish"
                  style={{ display: "inline-block", padding: "13px 28px", background: GOLD, color: NAVY, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", textDecoration: "none" }}>
                  Contact Us to Arrange Payment
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
