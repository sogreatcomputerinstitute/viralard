import Link from "next/link";
import type { Metadata } from "next";
import { headers as headerList } from "next/headers";
import { SiteHeader } from "@/components/SiteHeader";
import { TeaserAnalyzer } from "@/components/TeaserAnalyzer";
import { AnimatedHero, AnimatedSection, AnimatedStagger } from "@/components/Motion";
import { AuroraProvider } from "@/components/AuroraProvider";
import { WhatsAppContact } from "@/components/WhatsAppContact";
import { AdSlot } from "@/components/AdSlot";
import { adSlots } from "@/lib/ads";
import { PATTERNS } from "@/lib/engine/patterns";
import { scoreHook } from "@/lib/engine/score";
import { FREE_MONTHLY_LIMIT } from "@/lib/limits";
import {
  PLANS,
  REGION_LABELS,
  formatPrice,
  priceFor,
  type PlanKey,
  type Region,
} from "@/lib/pricing";
import type { Niche } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Viralard - Live Feed Hijack & Short-Form Script Simulator | Ask Ninja Tech";
  const description =
    "Score your short-form video hook, rewrite it three ways, and simulate it inside a live TikTok, Reels or Shorts feed. Stop guessing your first 3 seconds.";

  /*
   * Derives the canonical origin from the incoming request when
   * NEXT_PUBLIC_SITE_URL is unset, so canonical tags and Open Graph URLs stay
   * correct on any Vercel domain or preview deployment without an env var.
   */
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const base = configured ?? (await headerList()).get("origin") ?? "https://viralard.vercel.app";

  return {
    title,
    description,
    alternates: { canonical: base },
    openGraph: { url: base, title, description, siteName: "Viralard" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const DEMO: { text: string; niche: Niche }[] = [
  { text: "Your first 3 seconds are wasted.", niche: "general" },
  { text: "Stop buying bitcoin on the hype.", niche: "general" },
  { text: "Hey guys welcome back to my channel", niche: "general" },
];

const PAIN_OLD = [
  "3 hours editing a video nobody finishes",
  "Post it, cross your fingers",
  "Watch retention cliff-drop at 0:02",
  "Guess what went wrong, film again",
  "Do this 40 times a month",
];

const PAIN_NEW = [
  "Paste the opening line",
  "Get a score in under a second",
  "See exactly which pillar is leaking",
  "Take the rewrite that fixes it",
  "Upload with the first frame already handled",
];

const FEATURES = [
  {
    title: "Hook Strength Scoring",
    copy: "Four weighted metrics - speed, readability, structure and curiosity gap - broken down so you know exactly what to change, not just that you did something wrong.",
  },
  {
    title: "Psychological Rewrites",
    copy: "Three structural alternatives built on real frameworks: Pattern Interrupt, Negative Frame and Curiosity Loop. Each one engineered to land inside three seconds.",
  },
  {
    title: "Safe Zone Visualizer",
    copy: "Drop your line into a TikTok, Reels or Shorts frame and see whether the app's own buttons are sitting on top of your words.",
  },
];

const AGENCY_FEATURES = [
  "10 creator seats",
  "Shared hook library",
  "Bulk analysis",
  "Client-facing score reports",
];

async function detectRegion(): Promise<Region> {
  const { headers } = await import("next/headers");
  const list = await headers();
  const country = list.get("x-vercel-ip-country") ?? list.get("cf-ipcountry");
  return country === "NG" ? "ng" : "intl";
}

const PLAN_ORDER: PlanKey[] = ["free", "pro", "credits", "agency"];

export default async function LandingPage() {
  const region = await detectRegion();
  const [afterProblem, afterFeatures] = adSlots();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader email={null} signedIn={false} />

      <AuroraProvider />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <section className="grid items-start gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <AnimatedHero>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-zinc-300">
              Live Feed Hijack Simulator
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-tight sm:text-[3.4rem]">
              Stop Guessing Your <span className="text-gradient">First 3 Seconds</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">
              Viralard scores and rewrites your video hooks, then drops them into a live scrolling feed so you
              can see whether they would actually stop the swipe - before you film a single frame.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/app" className="btn-primary px-7 py-3.5 text-[15px]">
                Test your first script free
              </Link>
              <span className="text-xs text-ink-muted">No card needed</span>
            </div>
          </AnimatedHero>

          <div className="min-w-0">
            <AnimatedSection y={34} delay={0.1}>
              <TeaserAnalyzer />
            </AnimatedSection>

            <AnimatedSection delay={0.25} y={20} className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Live scoring</p>
              <div className="mt-5 space-y-4">
                {DEMO.map((demo) => {
                  const result = scoreHook(demo.text, demo.niche);
                  const stroke =
                    result.band === "strong"
                      ? "text-good"
                      : result.band === "workable"
                        ? "text-mid"
                        : "text-bad";

                  return (
                    <div key={demo.text} className="surface-solid rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="min-w-0 text-sm leading-relaxed text-zinc-200">
                          {demo.text.length > 62 ? `${demo.text.slice(0, 62)}...` : demo.text}
                        </p>
                        <span className={`shrink-0 text-2xl font-semibold tabular-nums ${stroke}`}>
                          {result.total}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] capitalize tracking-wide text-ink-muted">
                        {result.band} hook - {result.wordCount} words
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 text-[11px] leading-relaxed text-ink-muted/70">
                Real output from the scoring engine. Computed, not predicted.
              </p>
            </AnimatedSection>
          </div>
        </section>

        <AnimatedSection className="border-t border-white/8 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            The 200-view jail has a cause
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-ink-muted">
            TikTok buries anything that loses the first three seconds. Almost nobody can tell you which of the
            four things went wrong.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <AnimatedSection y={24}>
              <div className="surface-solid h-full rounded-3xl p-7">
                <p className="text-xs uppercase tracking-[0.16em] text-bad">The old way</p>
                <ul className="mt-5 space-y-3.5">
                  {PAIN_OLD.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-zinc-400">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-bad" />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-white/8 pt-4 text-sm text-zinc-500">
                  Total time to find out why: three hours of guessing.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection y={24} delay={0.12}>
              <div className="glass h-full rounded-3xl p-7">
                <p className="text-xs uppercase tracking-[0.16em] text-good">The Viralard way</p>
                <ul className="mt-5 space-y-3.5">
                  {PAIN_NEW.map((line) => (
                    <li key={line} className="flex gap-3 text-sm text-zinc-200">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-good" />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-white/8 pt-4 text-sm text-zinc-400">
                  Total time to find out why: five seconds.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </AnimatedSection>

        <AnimatedSection className="border-t border-white/8 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>

          <AnimatedStagger className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <div key={feature.title} className="glass rounded-3xl p-7">
                <span className="grid size-7 place-items-center rounded-lg bg-white/8 text-xs font-semibold text-zinc-300">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-medium text-ink">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{feature.copy}</p>
              </div>
            ))}
          </AnimatedStagger>

          <AnimatedStagger className="mt-4 grid gap-4 sm:grid-cols-3">
            {PATTERNS.map((pattern) => (
              <div key={pattern.id} className="surface-solid rounded-2xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-2">
                  {pattern.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{pattern.goal}</p>
                <p className="mt-3 border-t border-white/8 pt-3 text-xs italic text-ink-muted">
                  &ldquo;{pattern.example}&rdquo;
                </p>
              </div>
            ))}
          </AnimatedStagger>
        </AnimatedSection>

        <AnimatedSection className="pb-16">
          <AdSlot slot={afterProblem} />
        </AnimatedSection>

        <AnimatedSection id="pricing" className="border-t border-white/8 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Showing prices for <span className="text-ink">{REGION_LABELS[region]}</span>.
              </p>
            </div>
          </div>

          <AnimatedStagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((key) => {
              const price = priceFor(key, region);
              const featured = key === "pro";

              return (
                <div
                  key={key}
                  className={featured ? "glass rounded-3xl p-7" : "surface-solid rounded-3xl p-7"}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-ink">{PLANS[key].name}</h3>
                    {featured ? (
                      <span className="rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-accent-2">
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-[11px] text-ink-muted">{PLANS[key].blurb}</p>

                  <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                    {formatPrice(price)}
                    <span className="text-sm font-normal text-ink-muted">{price.cadence}</span>
                  </p>

                  <ul className="mt-5 space-y-2 text-[13px] leading-relaxed text-zinc-400">
                    {key === "free" ? (
                      <>
                        <li>{FREE_MONTHLY_LIMIT} hook analyses a month</li>
                        <li>One video analysis</li>
                        <li>Full four-metric breakdown</li>
                        <li>Safe zone visualizer</li>
                      </>
                    ) : key === "pro" ? (
                      <>
                        <li>Unlimited analyses</li>
                        <li>Unlimited video analysis</li>
                        <li>All niche personas</li>
                        <li>Localisation into 18 languages</li>
                      </>
                    ) : key === "credits" ? (
                      <>
                        <li>50 extra analyses</li>
                        <li>No subscription</li>
                        <li>Never expires</li>
                      </>
                    ) : (
                      AGENCY_FEATURES.map((line) => <li key={line}>{line}</li>)
                    )}
                  </ul>

                  {key === "free" ? (
                    <Link href="/app" className="btn-ghost mt-6 block w-full px-4 py-2.5 text-center text-sm">
                      Start free
                    </Link>
                  ) : (
                    <WhatsAppContact
                      email={null}
                      label={key === "pro" ? "Get Creator Pro" : key === "agency" ? "Get Agency Pro" : "Buy credits"}
                      size="sm"
                    />
                  )}
                </div>
              );
            })}
          </AnimatedStagger>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
            <span>Secure payments via</span>
            <span className="rounded-md border border-white/10 px-2 py-1 font-medium text-zinc-300">stripe</span>
            <span className="rounded-md border border-white/10 px-2 py-1 font-medium text-zinc-300">Paystack</span>
            <span>We never store your card details.</span>
          </div>
        </AnimatedSection>

        <AnimatedSection className="pb-16">
          <AdSlot slot={afterFeatures} />
        </AnimatedSection>

        <AnimatedSection className="border-t border-white/8 py-16">
          <div className="glass flex flex-wrap items-center justify-between gap-8 rounded-3xl p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Your next viral video is one hook away.
              </h2>
              <p className="mt-3 text-sm text-ink-muted">
                {FREE_MONTHLY_LIMIT} free analyses a month. No card needed.
              </p>
            </div>
            <Link href="/app" className="btn-primary px-8 py-4 text-base">
              Test your first script free
            </Link>
          </div>
        </AnimatedSection>
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          <p className="text-xs leading-relaxed text-ink-muted/70">
            Viralard grades text structure, not video retention. The score is a deterministic heuristic built
            from a published four-metric rubric - it is not a prediction of how your video will perform, and we
            have no view of your analytics.
          </p>
        </div>
      </footer>
    </div>
  );
}
