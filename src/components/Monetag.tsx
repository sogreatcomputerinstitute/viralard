import Script from "next/script";

/**
 * Monetag tag. Gated on an env var so it can be disabled without a redeploy,
 * and so it is obvious in review when it is on.
 *
 * Set MONETAG_ENABLED=true and MONETAG_ZONE_ID to the zone id.
 */
export function Monetag() {
  if (process.env.MONETAG_ENABLED !== "true") return null;

  const zone = process.env.MONETAG_ZONE_ID;
  if (!zone) return null;

  return (
    <Script
      id="monetag"
      async
      data-cfasync="false"
      src={`https://quge5.com/88/tag.min.js`}
      data-zone={zone}
      strategy="afterInteractive"
    />
  );
}