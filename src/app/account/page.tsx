import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AccountPanel } from "@/components/AccountPanel";
import { FREE_MONTHLY_LIMIT, CREDITS_PER_PACK } from "@/lib/limits";
import { isActivationConfigured } from "@/lib/activation";
import { formatPrice, priceFor } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

async function detectRegion(): Promise<Region> {
  const { headers } = await import("next/headers");
  const list = await headers();
  return list.get("x-vercel-ip-country") === "NG" ? "ng" : "intl";
}

export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const region = await detectRegion();
  const proPrice = priceFor("pro", region);
  const creditPrice = priceFor("credits", region);

  const [{ data: profile }, { data: usage }, { data: allHooks }, { data: recent }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, credits, video_trial_used, subscription_status, created_at, full_name, avatar_url")
      .eq("id", data.user.id)
      .maybeSingle(),
    supabase
      .from("usage_monthly")
      .select("count")
      .eq("user_id", data.user.id)
      .eq("month", monthStart())
      .maybeSingle(),
    supabase.from("hooks").select("id").eq("user_id", data.user.id),
    supabase
      .from("hooks")
      .select("id, text, total, band, created_at")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const plan = profile?.plan === "pro" ? "pro" : "free";
  const used = usage?.count ?? 0;

  return (
    <div className="flex min-h-full flex-col">
      <div className="lg:hidden">
        <SiteHeader email={data.user.email ?? null} signedIn />
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Your plan, your quota, and everything you have analysed.
        </p>

        <AccountPanel
          email={data.user.email ?? ""}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? data.user.user_metadata?.avatar_url ?? null}
          plan={plan}
          credits={profile?.credits ?? 0}
          used={used}
          monthlyLimit={FREE_MONTHLY_LIMIT}
          videoTrialUsed={Boolean(profile?.video_trial_used)}
          creditsPerPack={CREDITS_PER_PACK}
          totalHooks={allHooks?.length ?? 0}
          codesEnabled={isActivationConfigured()}
          proPrice={`${formatPrice(proPrice)}${proPrice.cadence}`}
          creditPrice={`${formatPrice(creditPrice)}${creditPrice.cadence}`}
          recentHooks={recent ?? []}
        />
      </main>
    </div>
  );
}
