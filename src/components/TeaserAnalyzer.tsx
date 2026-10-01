"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { scoreHook } from "@/lib/engine/score";
import { HOOK_MAX_CHARS } from "@/lib/engine/types";

const BAND_STROKE: Record<"strong" | "workable" | "weak", string> = {
  strong: "var(--color-good)",
  workable: "var(--color-mid)",
  weak: "var(--color-bad)",
};

const SAMPLES = [
  "Hey everyone welcome back to my channel",
  "Your first 3 seconds are wasted.",
  "Stop buying bitcoin on the hype.",
];

/**
 * Runs entirely in the browser. The score is deterministic, so there is no API
 * call, no Gemini cost and no rate limit - a visitor can mash this button
 * without costing anything. That is what makes it usable as a headline CTA.
 */
export function TeaserAnalyzer() {
  const [text, setText] = useState("");
  const [revealed, setRevealed] = useState(false);

  const result = useMemo(() => {
    if (text.trim().length < 8) return null;
    return scoreHook(text);
  }, [text]);

  const ready = Boolean(result);
  const size = 132;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = result ? circumference * (1 - result.total / 100) : circumference;

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Try it right here</p>
        <span className="text-[11px] text-ink-muted">No account needed</span>
      </div>

      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value.slice(0, HOOK_MAX_CHARS));
          setRevealed(false);
        }}
        rows={3}
        placeholder="Paste your opening line"
        aria-label="Your opening line"
        className="focus-ring mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-base leading-relaxed text-ink outline-none transition placeholder:text-ink-muted/50"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SAMPLES.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => {
              setText(sample);
              setRevealed(false);
            }}
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-ink-muted transition hover:border-accent/50 hover:text-ink"
          >
            {sample.length > 30 ? `${sample.slice(0, 30)}...` : sample}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        disabled={!ready}
        className="btn-primary mt-4 w-full px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        Analyze my hook
      </button>

      {result && revealed ? (
        <div className="animate-fade-rise mt-6 space-y-4 border-t border-white/10 pt-5">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={strokeWidth} />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={BAND_STROKE[result.band]}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold tabular-nums" style={{ color: BAND_STROKE[result.band] }}>
                  {result.total}
                </span>
                <span className="text-[9px] uppercase tracking-[0.16em] text-ink-muted">Hook strength</span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-sm capitalize text-ink">{result.band} hook</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{result.verdict.split(".")[0]}.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {(["curiosity", "readability", "speed", "structure"] as const).map((pillar) => {
              const data = result.pillars[pillar];
              const ratio = data.max === 0 ? 0 : Math.min(1, data.earned / data.max);
              return (
                <div key={pillar} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[11px] capitalize text-ink-muted">{pillar}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-3"
                      style={{ width: `${ratio * 100}%`, transition: "width 700ms ease" }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-ink-muted">
                    {data.earned}/{data.max}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="surface-solid rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-ink">
              Your score is {result.total}. Want the 3 rewrites that fix it?
            </p>
            <Link href="/app" className="btn-primary mt-3 block px-5 py-2.5 text-sm">
              Unlock 3 viral rewrites free
            </Link>
            <p className="mt-2 text-[11px] text-ink-muted">No card required</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}