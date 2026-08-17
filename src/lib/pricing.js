// Shared quantity-tier pricing logic, used by both the catalog/cart (App.jsx)
// and the Custom Production consultation estimate (ConsultationModal.jsx).
// Kept in one place so every surface that shows a price resolves it exactly
// the same way — no separate/duplicated pricing implementation anywhere.

export const TIERS = [
  {id:"R1",lbl:"10-20/SKU",  min:10, max:20,  grp:"retail"},
  {id:"R2",lbl:"21-40/SKU",  min:21, max:40,  grp:"retail"},
  {id:"R3",lbl:"41-60/SKU",  min:41, max:60,  grp:"retail"},
  {id:"T1",lbl:"61-199/SKU", min:61, max:199, grp:"wholesale"},
  {id:"T2",lbl:"200-399/SKU",min:200,max:399, grp:"wholesale"},
  {id:"T3",lbl:"400-599/SKU",min:400,max:599, grp:"wholesale"},
  {id:"T4",lbl:"600-999/SKU",min:600,max:999, grp:"wholesale"},
  {id:"T5",lbl:"1000+/SKU",  min:1000,max:null,grp:"wholesale"},
];

export const DEFAULT_MIN_QTY = 3;

// Products in these internal categories carry the 3-4/5-9 unit surcharge.
// Sprays, Topicals (Creams), Capsules, and Diluents (Recon Water) are
// intentionally excluded — they keep their existing pricing untouched.
const STANDARD_PEPTIDE_CATEGORIES = ["Peptides", "GLP", "Blends", "Bio Regulators"];
export const isStandardPeptideCategory = c => STANDARD_PEPTIDE_CATEGORIES.includes(c);

// 3-4 units: Tier 1 (R1) +20%. 5-9 units: Tier 1 (R1) +15%. 10+: no change —
// the existing 8-tier ladder already applies at that point.
export function surchargeMultiplier(qty, category) {
  if (!isStandardPeptideCategory(category)) return 1;
  const q = qty || 0;
  if (q >= 3 && q < 5) return 1.20;
  if (q >= 5 && q < 10) return 1.15;
  return 1;
}

export function tierForQty(qty, minQty = DEFAULT_MIN_QTY) {
  const q = Math.max(minQty, qty || minQty);
  for (const t of TIERS) {
    if (q >= t.min && (t.max === null || q <= t.max)) return t.id;
  }
  return "R1";
}

// A handful of SKUs (e.g. Recon Water) don't follow the standard 8-tier
// R1-T5 model at all — they have their own quantity breakpoints. Those
// variants carry a `customTierRanges` array of {id, min, max} brackets,
// and a literal field on the variant named after each bracket's id holding
// that bracket's price — so every existing `variant[tier]` price lookup
// elsewhere in the app keeps working unchanged, standard products included.
export function resolveTier(variant, qty) {
  if (variant && variant.customTierRanges) {
    const q = Math.max(DEFAULT_MIN_QTY, qty || DEFAULT_MIN_QTY);
    const bracket = variant.customTierRanges.find(b => q >= b.min && (b.max === null || q <= b.max));
    // A qty below the lowest defined bracket (e.g. 3-9 units, below Recon
    // Water's CT1 floor of 10) resolves to the entry-level bracket — never
    // the deepest bulk-discount bracket.
    return (bracket || variant.customTierRanges[0]).id;
  }
  return tierForQty(qty);
}

// The final per-unit price for a line: resolves the tier, then applies the
// standard-peptide surcharge (a no-op for every other category/quantity).
export function unitPriceFor(variant, qty, category) {
  const tier = resolveTier(variant, qty);
  const base = variant[tier];
  return base == null ? base : base * surchargeMultiplier(qty, category);
}

// The lowest-quantity bracket's price, for the "Starting At" display —
// falls back to R1 for every standard (non-custom-tier) product.
export function startingPrice(variant) {
  if (variant && variant.customTierRanges) {
    return variant[variant.customTierRanges[0].id];
  }
  return variant.R1;
}

export const fmt = n => n != null ? "$" + Number(n).toFixed(2) : "$0.00";

// A price is only valid for display if it is a finite, positive number.
// null/undefined/0/NaN all mean "no pricing data" — never render those as $0.
export const hasPrice = n => typeof n === "number" && Number.isFinite(n) && n > 0;
export const NO_PRICE_LABEL = "Pricing Available Upon Request";

// Splits a dollar amount into a 50/50 deposit + remaining balance using
// integer-cent arithmetic, so the two halves always sum back to exactly the
// original amount — including odd-cent totals, where naive `total*0.5`
// rounding on each half independently can silently drop or duplicate a cent.
export function splitDeposit(amount) {
  const totalCents = Math.round((amount || 0) * 100);
  const depositCents = Math.round(totalCents / 2);
  const remainingCents = totalCents - depositCents;
  return { deposit: depositCents / 100, remaining: remainingCents / 100 };
}
