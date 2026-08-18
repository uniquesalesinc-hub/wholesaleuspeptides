// Shared Custom Production order-status model — imported both by the
// browser (admin/status pages) and by Vercel serverless functions
// (api/admin/orders/[id]/[action].js), the same way src/lib/pricing.js is
// already shared between the catalog and the consultation modal. No
// browser-only globals here, so it's safe in either environment.

export const STATUS_LABELS = {
  REQUEST_SUBMITTED: "Request Submitted",
  QUOTE_APPROVED: "Quote Approved",
  DEPOSIT_DUE: "Deposit Due",
  DEPOSIT_PAID: "Deposit Paid",
  IN_PRODUCTION: "In Production",
  PRODUCTION_COMPLETE: "Production Complete",
  BALANCE_DUE: "Balance Due",
  PAID_IN_FULL: "Paid in Full",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
};

// Shown to the customer on the order-status page for whatever status the
// order currently holds. Statuses that are never a *resting* state in the
// Phase 1 flow (QUOTE_APPROVED, PRODUCTION_COMPLETE — both are combined
// into the next status by the admin actions below) have no entry here.
export const STATUS_CUSTOMER_MESSAGE = {
  REQUEST_SUBMITTED: "We've received your Custom Production request. Our wholesale team is reviewing it and will follow up with a confirmed quote.",
  DEPOSIT_DUE: "Your quote has been approved. A 50% deposit is required to begin production.",
  DEPOSIT_PAID: "Your deposit has been received. Your order is queued for production.",
  IN_PRODUCTION: "Your order is currently in production.",
  BALANCE_DUE: "Your custom production order is complete. The remaining balance is now due. Once final payment is received, your order will be prepared for shipment. Shipping typically takes 2–3 business days after final payment.",
  PAID_IN_FULL: "Final payment received. Your order is being prepared for shipment.",
  READY_TO_SHIP: "Your order is packaged and ready to ship.",
  SHIPPED: "Your order has shipped.",
  COMPLETED: "This order is complete.",
};

// Every admin action, keyed by its URL segment
// (/api/admin/orders/:id/:action). Each bundles the status transition it
// performs with its real side effects, so the admin UI can only ever show
// the actions valid for an order's current status — invalid/out-of-order
// transitions are prevented by construction, not just by convention.
//
// QUOTE_APPROVED->DEPOSIT_DUE and PRODUCTION_COMPLETE->BALANCE_DUE are
// each collapsed into a single action/single customer email, since Phase
// 1 has no separate "send invoice" step that would justify two manual
// clicks and two emails for what is, in practice, one moment.
export const ACTIONS = {
  "approve-quote": {
    label: "Approve Quote",
    fromStatus: "REQUEST_SUBMITTED",
    toStatus: "DEPOSIT_DUE",
    logNote: "Quote approved; deposit due",
    emailEvent: "deposit_due",
  },
  "mark-deposit-paid": {
    label: "Mark Deposit Received",
    fromStatus: "DEPOSIT_DUE",
    toStatus: "DEPOSIT_PAID",
    emailEvent: "deposit_received",
  },
  "start-production": {
    label: "Start Production",
    fromStatus: "DEPOSIT_PAID",
    toStatus: "IN_PRODUCTION",
    emailEvent: "production_started",
  },
  "mark-production-complete": {
    label: "Mark Production Complete",
    fromStatus: "IN_PRODUCTION",
    toStatus: "BALANCE_DUE",
    logNote: "Production complete; balance due",
    emailEvent: "balance_due",
  },
  "mark-balance-paid": {
    label: "Mark Final Payment Received",
    fromStatus: "BALANCE_DUE",
    toStatus: "PAID_IN_FULL",
    emailEvent: "final_payment_received",
  },
  "mark-ready-to-ship": {
    label: "Mark Ready to Ship",
    fromStatus: "PAID_IN_FULL",
    toStatus: "READY_TO_SHIP",
    emailEvent: null,
  },
  "mark-shipped": {
    label: "Mark Shipped",
    fromStatus: "READY_TO_SHIP",
    toStatus: "SHIPPED",
    emailEvent: "order_shipped",
    requiresTracking: true,
  },
  "mark-completed": {
    label: "Mark Completed",
    fromStatus: "SHIPPED",
    toStatus: "COMPLETED",
    emailEvent: null,
  },
};
