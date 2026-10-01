/**
 * Regional pricing.
 *
 * Nigeria is priced in naira because that is where the creator audience is, and
 * a $15 USD ask is roughly ten times what the same buyer can justify locally.
 * Regional pricing is also a real arbitrage surface: nothing here verifies
 * residency, so a buyer outside the region can simply pick the cheaper card.
 * That is an accepted trade-off at this stage, not an oversight - if it becomes
 * a problem, the fix is payment-processor based country detection at checkout,
 * not a hidden geolocation check.
 */

export type Region = "ng" | "intl";

export type PlanKey = "free" | "pro" | "credits" | "agency";

export type Price = {
  amount: number;
  currency: "NGN" | "USD";
  symbol: string;
  suffix: string;
  cadence: string;
};

export const PLANS: Record<PlanKey, { name: string; blurb: string }> = {
  free: { name: "Free", blurb: "Get a feel for it." },
  pro: { name: "Creator Pro", blurb: "For creators posting weekly." },
  credits: { name: "Credit pack", blurb: "One campaign, no subscription." },
  agency: { name: "Agency Pro", blurb: "For teams running many accounts." },
};

const PRICES: Record<Region, Record<PlanKey, Price>> = {
  ng: {
    free: { amount: 0, currency: "NGN", symbol: "\u20a6", suffix: "", cadence: "forever" },
    pro: { amount: 5000, currency: "NGN", symbol: "\u20a6", suffix: "", cadence: "/month" },
    credits: { amount: 2000, currency: "NGN", symbol: "\u20a6", suffix: "", cadence: " one-time" },
    agency: { amount: 18000, currency: "NGN", symbol: "\u20a6", suffix: "", cadence: "/month" },
  },
  intl: {
    free: { amount: 0, currency: "USD", symbol: "$", suffix: "", cadence: "forever" },
    pro: { amount: 12, currency: "USD", symbol: "$", suffix: "", cadence: "/month" },
    credits: { amount: 5, currency: "USD", symbol: "$", suffix: "", cadence: " one-time" },
    agency: { amount: 49, currency: "USD", symbol: "$", suffix: "", cadence: "/month" },
  },
};

const NIGERIA_CODES = new Set(["ng", "nigeria", "naija"]);

export function regionFromCountry(country: string | undefined | null): Region {
  if (!country) return "intl";
  return NIGERIA_CODES.has(country.trim().toLowerCase()) ? "ng" : "intl";
}

export function priceFor(plan: PlanKey, region: Region): Price {
  return PRICES[region][plan];
}

export function formatPrice(price: Price): string {
  const formatted = new Intl.NumberFormat(price.currency === "NGN" ? "en-NG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(price.amount);

  return `${price.symbol}${formatted}${price.suffix}`;
}

export const REGION_LABELS: Record<Region, string> = {
  ng: "Nigeria",
  intl: "International",
};

/*
 * At 1 USD = 1,328.65 NGN (checked 2026-10-01, open.er-api.com):
 *
 *   Pro Nigeria        N5,000  = $3.76 USD
 *   Pro international  $12     = N15,944
 *
 * That is a 69% discount, not a rounding error. Nothing verifies residency, so
 * it is also trivially arbitrageable - a buyer anywhere can open the cheaper
 * card. Accepted for now because the margin is enormous (an analysis costs
 * roughly $0.00035 in API calls). If it becomes a leak, move to payment
 * processor country detection at checkout.
 *
 * N10,000 (~$7.50) is the number to try if Nigerian conversion underperforms.
 */