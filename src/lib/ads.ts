/**
 * Ad configuration.
 *
 * Two channels, because they behave completely differently:
 *
 * 1. FIRST PARTY slots. Rendered by our own HTML, so ad blockers cannot remove
 *    them - blockers filter by request origin, and these have no third-party
 *    request at all. Works on every device, every browser, offline-tolerant.
 *    This is the channel that actually delivers.
 *
 * 2. THIRD PARTY popunder (Monetag). Wired via `Monetag`, disabled by default.
 *    It works technically everywhere except iOS Safari, which suppresses
 *    popunders, and it is network-blocked by most privacy tooling. Kept
 *    switchable because it costs nothing to leave available.
 */

export type AdSlotVariant = "inflow" | "rail";

export type AdSlotConfig = {
  id: string;
  variant: AdSlotVariant;
  /** Direct-sold sponsor creative. No third-party request involved. */
  imageUrl?: string;
  href?: string;
  headline: string;
  body: string;
  cta: string;
  /** Filled by the route at request time; honest about whether it is served. */
  filled: boolean;
};

const SPONSOR_IMAGE = process.env.AD_SPONSOR_IMAGE_URL;
const SPONSOR_HREF = process.env.AD_SPONSOR_HREF;

/**
 * House ad. Served whenever there is no paid sponsor configured, so the slot is
 * never blank - a blank slot reads as a broken layout.
 */
export function adSlots(): AdSlotConfig[] {
  return [
    {
      id: "after-problem",
      variant: "inflow",
      imageUrl: SPONSOR_IMAGE,
      href: SPONSOR_HREF ?? "/#pricing",
      headline: "HookCraft Pro",
      body: "Unlimited analyses, video transcription, 18-language localisation and the full guardrail scanner.",
      cta: "See plans",
      filled: Boolean(SPONSOR_HREF),
    },
    {
      id: "after-features",
      variant: "inflow",
      imageUrl: SPONSOR_IMAGE,
      href: SPONSOR_HREF ?? "/app",
      headline: "Try it on your hook",
      body: "Score any opening line in under a second. No card required.",
      cta: "Open the analyzer",
      filled: Boolean(SPONSOR_HREF),
    },
    {
      id: "account-rail",
      variant: "rail",
      imageUrl: SPONSOR_IMAGE,
      href: SPONSOR_HREF ?? "/#pricing",
      headline: "Need more seats?",
      body: "Agency Pro covers ten creators with a shared hook library.",
      cta: "Compare plans",
      filled: Boolean(SPONSOR_HREF),
    },
  ];
}