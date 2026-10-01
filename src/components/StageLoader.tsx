"use client";

import { useEffect, useRef, useState } from "react";

export type LoaderStage = {
  id: string;
  label: string;
  detail: string;
};

type Props = {
  stages: LoaderStage[];
  activeIndex: number;
  /** 0 to 1 within the active stage, or null when indeterminate. */
  ratio: number | null;
  headline: string;
  previewUrl?: string | null;
};

export function StageLoader({ stages, activeIndex, ratio, headline, previewUrl }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (ratio === null) return;

    let frame = 0;
    const target = Math.round(Math.max(0, Math.min(1, ratio)) * 100);

    const step = () => {
      setDisplayed((current) => {
        if (current === target) return current;
        const delta = target - current;
        const stepSize = Math.max(1, Math.abs(delta) * 0.18);
        return delta > 0
          ? Math.min(target, current + stepSize)
          : Math.max(target, current - stepSize);
      });
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [ratio]);

  useEffect(() => {
    if (ratio === null && barRef.current) {
      barRef.current.style.width = "35%";
    }
  }, [ratio]);

  const active = stages[activeIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-void/80 backdrop-blur-xl" />

      <div className="animate-fade-rise glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-7">
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-accent-2/20 blur-3xl" />

        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent-2">Viralard</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">{headline}</h2>

          {previewUrl ? (
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video src={previewUrl} muted playsInline className="w-full opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-1/3">
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-accent/40 via-accent-2/40 to-accent-3/40" />
              </div>
              <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] tabular-nums text-zinc-300 backdrop-blur">
                0.0s - {active?.id === "analysing" ? "3.0s" : "5.0s"}
              </span>
            </div>
          ) : null}

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
            {ratio === null ? (
              <div
                ref={barRef}
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                style={{ width: "35%", animation: "loader-slide 1.1s ease-in-out infinite" }}
              />
            ) : (
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-150"
                style={{ width: `${displayed}%` }}
              />
            )}
          </div>

          <p className="mt-3 text-sm text-zinc-300">{active?.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{active?.detail}</p>

          <ol className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
            {stages.map((stage, index) => {
              const done = index < activeIndex;
              const current = index === activeIndex;

              return (
                <li key={stage.id} className="flex items-center gap-3">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] transition ${
                      done
                        ? "border-accent-2/60 bg-accent-2/20 text-accent-2"
                        : current
                          ? "border-accent text-accent"
                          : "border-white/15 text-zinc-600"
                    }`}
                  >
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <path d="M1.5 5.2 4 7.5 8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    className={`text-xs transition ${
                      current ? "text-zinc-200" : done ? "text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {stage.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}