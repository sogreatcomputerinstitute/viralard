import Image from "next/image";

import type { AdSlotConfig } from "@/lib/ads";

/**
 * First-party ad slot.
 *
 * Deliberately in-flow and non-overlapping. A popunder on this product fires
 * during the Analyze click, which is the exact interaction the tool exists to
 * make valuable - so slots sit between sections on the landing page and in the
 * account rail, never over the analyzer while it is in use.
 *
 * The slot reserves its height so a slow or failed creative cannot cause layout
 * shift, and it degrades to a plain link if the image 404s.
 */
export function AdSlot({ slot }: { slot: AdSlotConfig }) {
  const rail = slot.variant === "rail";

  const creative = slot.imageUrl ? (
    <Image
      src={slot.imageUrl}
      alt=""
      width={rail ? 320 : 1200}
      height={rail ? 100 : 90}
      unoptimized
      className={`w-full rounded-lg object-cover ${rail ? "h-20" : "max-h-24"}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-accent/25 to-accent-3/10 ${
        rail ? "h-20" : "h-20"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Sponsored</span>
    </div>
  );

  const body = (
    <>
      {rail ? null : creative}
      <div className={rail ? "" : "mt-4"}>
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          {slot.filled ? "Sponsored" : "Recommended"}
        </p>
        <p className={`mt-1 font-medium text-ink ${rail ? "text-sm" : "text-base"}`}>{slot.headline}</p>
        <p className={`mt-1 leading-relaxed text-ink-muted ${rail ? "text-[11px]" : "text-sm"}`}>
          {slot.body}
        </p>
        <span
          className={`mt-3 inline-block rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-zinc-200 ${
            rail ? "" : "sm:px-4 sm:py-2 sm:text-sm"
          }`}
        >
          {slot.cta}
        </span>
      </div>
    </>
  );

  return (
    <aside
      aria-label="Sponsored message"
      className={`surface-solid block w-full rounded-2xl ${
        rail ? "p-4" : "p-5 sm:p-6"
      } ${slot.id === "account-rail" ? "mt-6" : ""}`}
    >
      {slot.href?.startsWith("http") ? (
        <a
          href={slot.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block transition hover:opacity-90"
        >
          {body}
        </a>
      ) : (
        <Link href={slot.href ?? "/#pricing"} className="block transition hover:opacity-90">
          {body}
        </Link>
      )}
    </aside>
  );
}

import Link from "next/link";