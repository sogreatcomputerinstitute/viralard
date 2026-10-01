"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setStatus("sending");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your inbox for the sign-in link.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to HookCraft</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Your hooks, scores and rewrites sync across devices.
        </p>
      </div>

      <div className="glass space-y-4 rounded-2xl p-5">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={status === "sending"}
          className="btn-ghost flex w-full items-center justify-center gap-3 px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="focus-ring w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary w-full px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Email me a magic link"}
          </button>
        </form>

        {message ? (
          <p className={`text-xs ${status === "error" ? "text-bad" : "text-zinc-400"}`}>{message}</p>
        ) : null}
      </div>

      <p className="text-center text-xs leading-relaxed text-zinc-500">
        Free accounts get 5 hook analyses a month. No card required.
      </p>
    </div>
  );
}