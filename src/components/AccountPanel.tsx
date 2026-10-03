"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WhatsAppContact } from "@/components/WhatsAppContact";

type RecentHook = {
  id: string;
  text: string;
  total: number;
  band: "strong" | "workable" | "weak";
  created_at: string;
};

function Meter({
  used,
  limit,
  label,
  detail,
}: {
  used: number;
  limit: number | null;
  label: string;
  detail: string;
}) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const critical = limit !== null && pct >= 100;

  return (
    <div className="surface-solid rounded-2xl p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className={`text-sm tabular-nums ${critical ? "text-bad" : "text-ink"}`}>
          {limit === null ? `${used}` : `${used} / ${limit}`}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            critical ? "bg-bad" : pct > 70 ? "bg-mid" : "bg-gradient-to-r from-accent to-accent-2"
          }`}
          style={{ width: `${limit === null ? 12 : pct}%` }}
        />
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-ink-muted">{detail}</p>
    </div>
  );
}

export function AccountPanel({
  email,
  fullName,
  avatarUrl,
  plan,
  credits,
  used,
  monthlyLimit,
  videoTrialUsed,
  creditsPerPack,
  totalHooks,
  codesEnabled,
  proPrice,
  creditPrice,
  recentHooks,
}: {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  plan: "free" | "pro";
  credits: number;
  used: number;
  monthlyLimit: number;
  videoTrialUsed: boolean;
  creditsPerPack: number;
  totalHooks: number;
  codesEnabled: boolean;
  proPrice: string;
  creditPrice: string;
  recentHooks: RecentHook[];
}) {
  const router = useRouter();
  const pro = plan === "pro";
  const remaining = Math.max(0, monthlyLimit - used);

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function activate(event: React.FormEvent) {
    event.preventDefault();
    setStatus("checking");
    setMessage(null);

    const response = await fetch("/api/pro/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(body?.error ?? `Activation failed (${response.status})`);
      return;
    }

    setStatus("idle");
    setMessage("Creator Pro activated.");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-14 rounded-full border border-white/12" />
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-lg font-bold text-white">
              {(fullName ?? email).charAt(0).toUpperCase()}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-ink">{fullName ?? email}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] ${
              pro
                ? "border-accent-2/40 bg-accent-2/10 text-accent-2"
                : "border-white/12 bg-white/5 text-zinc-400"
            }`}
          >
            {pro ? "Creator Pro" : "Free"}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-white/8 pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Hooks analysed</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">{totalHooks}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Credit pack</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-ink">
              {credits}
              <span className="text-sm font-normal text-ink-muted"> credits</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Video analysis</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">
              {pro ? "Unlimited" : videoTrialUsed ? "Trial used" : "1 free left"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Meter
          used={used}
          limit={pro ? null : monthlyLimit}
          label="Monthly analyses"
          detail={
            pro
              ? "Unlimited while your plan is active."
              : `${remaining} of ${monthlyLimit} left. Resets on the 1st of each month, UTC.`
          }
        />

        <Meter
          used={credits}
          limit={null}
          label="Top-up credits"
          detail={
            credits > 0
              ? `${creditsPerPack} credits per ${creditPrice} pack. Spent only after your monthly quota runs out.`
              : `A ${creditPrice} pack adds ${creditsPerPack} analyses. No subscription, never expires.`
          }
        />
      </section>

      {!pro ? (
        <section className="glass rounded-3xl p-6">
          <h2 className="text-sm font-medium text-ink">Upgrade to Creator Pro</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            Unlimited text and video analyses, all audience personas, and localisation into 18 languages.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold tracking-tight text-ink">{proPrice}</span>
            <Link href="/login" className="btn-ghost px-5 py-2.5 text-sm">
              Compare plans
            </Link>
          </div>

          <div className="mt-5 border-t border-white/8 pt-5">
            <WhatsAppContact email={email} />
          </div>

          {codesEnabled ? (
            <form onSubmit={activate} className="mt-5 border-t border-white/8 pt-5">
              <label htmlFor="code" className="text-xs text-ink-muted">
                Already have a code?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setStatus("idle");
                  }}
                  placeholder="VIRAL-PRO-XXXX"
                  className="focus-ring flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm uppercase tracking-wide outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "checking" || !code.trim()}
                  className="btn-ghost shrink-0 px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {status === "checking" ? "Checking..." : "Activate"}
                </button>
              </div>
              {message ? (
                <p className={`mt-2 text-xs ${status === "error" ? "text-bad" : "text-good"}`}>{message}</p>
              ) : null}
            </form>
          ) : null}
        </section>
      ) : null}

      {recentHooks.length > 0 ? (
        <section>
          <h2 className="text-sm font-medium text-ink">Recent hooks</h2>
          <div className="mt-3 space-y-2">
            {recentHooks.map((hook) => (
              <div
                key={hook.id}
                className="surface-solid flex items-center gap-4 rounded-2xl px-4 py-3"
              >
                <p className="min-w-0 flex-1 truncate text-sm text-zinc-200">{hook.text}</p>
                <span
                  className={`shrink-0 text-base font-semibold tabular-nums ${
                    hook.band === "strong"
                      ? "text-good"
                      : hook.band === "workable"
                        ? "text-mid"
                        : "text-bad"
                  }`}
                >
                  {hook.total}
                </span>
                <span className="hidden shrink-0 text-[11px] text-ink-muted sm:block">
                  {new Date(hook.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="surface-solid rounded-3xl p-6 text-center">
          <p className="text-sm text-ink-muted">No hooks saved yet.</p>
          <Link href="/app" className="btn-primary mt-4 inline-block px-5 py-2.5 text-sm">
            Analyse your first hook
          </Link>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-3 border-t border-white/8 pt-6">
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="btn-ghost px-5 py-2.5 text-sm">
            Sign out
          </button>
        </form>
        <Link href="/app" className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          Back to the analyzer
        </Link>
      </section>
    </div>
  );
}