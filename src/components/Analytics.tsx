import Script from "next/script";

const ID = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function Analytics() {
  if (!ID) return null;

  return (
    <>
      <Script
        defer
        data-domain={ID}
        src="https://plausible.io/js/script.outbound-links.js"
        strategy="afterInteractive"
      />
    </>
  );
}