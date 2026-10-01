"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/Modal";

export function ProGate({
  open,
  onClose,
  feature,
  detail,
  priceNote,
  signedIn,
  plan,
  codesEnabled,
  onActivated,
}: {
  open: boolean;
  onClose: () => void;
  feature: string;
  detail: string;
  priceNote: string;
  signedIn: boolean;
  plan: "free" | "pro";
  codesEnabled: boolean;
  onActivated: () => void;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const pro = plan === "pro";

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
    setMessage("Creator Pro activated. Reloading...");
    onActivated();
    window.location.reload();
  }

  return (
    <Modal open={open} onClose={onClose} title={pro ? "Already on Creator Pro" : feature}>
      {pro ? (
        <>
          <p className="text-sm leading-relaxed text-ink-muted">
            Your account has Creator Pro, so this is unlocked. If it still looks locked, sign out and back in.
          </p>
          <Link href="/app" className="btn-primary mt-5 block px-5 py-2.5 text-center text-sm">
            Back to the analyzer
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-ink-muted">{detail}</p>

          <div className="surface-solid mt-5 rounded-xl p-4">
            <p className="text-xs font-medium text-ink">Creator Pro</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink-muted">
              <li>Unlimited text and video analyses</li>
              <li>All audience personas</li>
              <li>Localisation into 18 languages</li>
              <li>Saved history of every hook</li>
            </ul>
            <p className="mt-3 text-sm font-medium text-ink">{priceNote}</p>
          </div>

          {!signedIn ? (
            <Link href="/login" className="btn-primary mt-5 block px-5 py-2.5 text-center text-sm">
              Sign in to continue
            </Link>
          ) : codesEnabled ? (
            <form onSubmit={activate} className="mt-5 space-y-3">
              <label htmlFor="activation" className="text-xs text-ink-muted">
                Got an activation code?
              </label>
              <input
                id="activation"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setStatus("idle");
                }}
                placeholder="VIRAL-PRO-XXXX"
                className="focus-ring w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm uppercase tracking-wide outline-none"
              />
              <button
                type="submit"
                disabled={status === "checking" || !code.trim()}
                className="btn-ghost w-full px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {status === "checking" ? "Checking..." : "Activate Pro"}
              </button>
              {message ? (
                <p className={`text-xs ${status === "error" ? "text-bad" : "text-good"}`}>{message}</p>
              ) : null}
            </form>
          ) : (
            <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
              Card checkout is not connected yet. Ask Ask Ninja Tech for a founder code.
            </p>
          )}

          <Link href="/#pricing" className="btn-primary mt-5 block px-5 py-2.5 text-center text-sm">
            Upgrade to Pro
          </Link>
        </>
      )}
    </Modal>
  );
}