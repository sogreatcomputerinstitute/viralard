import Link from "next/link";
import { Analyzer } from "@/components/Analyzer";
import { SiteHeader } from "@/components/SiteHeader";
import { FREE_MONTHLY_LIMIT } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { isActivationConfigured } from "@/lib/activation";
import { formatPrice, priceFor } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

async function detectRegion() {
  const { headers } = await import("next/headers");
  const list = await headers();
  const country = list.get("x-vercel-ip-country") ?? list.get("cf-ipcountry");
  return country === "NG" ? ("ng" as const) : ("intl" as const);
}

export default async function AppPage() {
  const region = await detectRegion();
  const proPrice = priceFor("pro", region);

  let email: string | null = null;
  let plan: "free" | "pro" = "free";
  let analysesUsed = 0;
  let videoTrialUsed = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      email = data.user.email ?? null;

      const [profile, usage] = await Promise.all([
        supabase.from("profiles").select("plan, video_trial_used").eq("id", data.user.id).maybeSingle(),
        supabase
          .from("usage_monthly")
          .select("count")
          .eq("user_id", data.user.id)
          .eq("month", monthStart())
          .maybeSingle(),
      ]);

      plan = profile?.data?.plan === "pro" ? "pro" : "free";
      videoTrialUsed = Boolean(profile?.data?.video_trial_used);
      analysesUsed = usage?.data?.count ?? 0;
    }
  } catch {
    // Schema or migration not applied yet. Stay usable signed out rather than erroring.
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="lg:hidden">
        <SiteHeader email={email} signedIn={Boolean(email)} />
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:pl-[19rem]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analyzer</h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              Type a line, or drop a draft and let us transcribe it.
            </p>
          </div>

          {email ? (
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] ${
                  plan === "pro"
                    ? "border-accent-2/40 bg-accent-2/10 text-accent-2"
                    : "border-white/12 bg-white/5 text-zinc-400"
                }`}
              >
                {plan === "pro" ? "Creator Pro" : "Free"}
              </span>
              <Link href="/#pricing" className="text-xs text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
                {plan === "pro" ? "Manage plan" : "Go Pro"}
              </Link>
            </div>
          ) : null}
        </div>

<Analyzer
          signedIn={Boolean(email)}
          plan={plan}
          analysesUsed={analysesUsed}
          monthlyLimit={FREE_MONTHLY_LIMIT}
          videoTrialUsed={videoTrialUsed}
codesEnabled={isActivationConfigured()}
          priceNote={`${formatPrice(proPrice)}${proPrice.cadence}`}
        />
      </main>
    </div>
  );
}