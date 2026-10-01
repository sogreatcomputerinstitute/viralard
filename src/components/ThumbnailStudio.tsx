"use client";

import { useMemo, useState } from "react";
import { THUMBNAIL_BLOCKS, gradeAll, type ThumbnailGrade } from "@/lib/thumbnail";

type Mode = "grid" | "peek";

/*
 * Synthetic competitor thumbnails. Same reasoning as the feed: TikTok and YouTube
 * expose no way to pull trending covers, and scraping them is not authorised.
 * These are visually varied so the question being answered - "will mine blend
 * in?" - is still answerable, because the answer depends on contrast and
 * legibility rather than on whose video it actually is.
 */
const RIVALS = [
  { title: "I TRIED THIS SO YOU DONT HAVE TO", hue: 348, words: 6, weight: 900 },
  { title: "3 THINGS", hue: 28, words: 2, weight: 900 },
  { title: "nobody talks about this", hue: 262, words: 4, weight: 600 },
  { title: "THIS CHANGED EVERYTHING", hue: 190, words: 3, weight: 800 },
  { title: "wait what", hue: 92, words: 2, weight: 900 },
  { title: "STOP DOING THIS IN 2026", hue: 8, words: 5, weight: 900 },
  { title: "the honest truth", hue: 220, words: 3, weight: 700 },
  { title: "99% GET THIS WRONG", hue: 46, words: 4, weight: 900 },
];

function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function ThumbnailFrame({
  title,
  hue,
  words,
  weight,
  yours,
  duration,
}: {
  title: string;
  hue: number;
  words: number;
  weight: number;
  yours?: boolean;
  duration?: string;
}) {
  return (
    <div className="relative">
      <div
        className={`relative aspect-[9/16] overflow-clip rounded-xl ${yours ? "ring-2 ring-accent" : "ring-1 ring-white/10"}`}
        style={{
          background: `linear-gradient(${140 + Math.floor(seeded(hue) * 80)}deg, hsl(${hue} 70% 22%), hsl(${(hue + 40) % 360} 65% 12%))`,
        }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(90% 55% at 25% 20%, rgba(255,255,255,0.5), transparent 65%), radial-gradient(80% 45% at 75% 85%, rgba(0,0,0,0.6), transparent 60%)",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center px-2">
          <p
            className="text-center uppercase leading-[0.95] text-white"
            style={{
              fontWeight: weight,
              fontSize: `${Math.max(9, 30 - words * 3.2)}px`,
              letterSpacing: words > 4 ? "-0.02em" : "0",
              textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)",
            }}
          >
            {title}
          </p>
        </div>

        {duration ? (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[8px] tabular-nums text-white">
            {duration}
          </span>
        ) : null}

        {yours ? (
          <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white">
            Yours
          </span>
        ) : null}
      </div>

      <p className="mt-1 truncate text-[10px] text-zinc-500">{yours ? "Your thumbnail" : title}</p>
    </div>
  );
}

function GradePill({ grade }: { grade: ThumbnailGrade }) {
  return (
    <div className="surface-solid rounded-xl p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">{grade.text}</p>
        <span
          className={`shrink-0 text-sm font-semibold tabular-nums ${
            grade.score === 100 ? "text-good" : grade.score >= 66 ? "text-mid" : "text-bad"
          }`}
        >
          {grade.score}%
        </span>
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {grade.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2">
            <span
              className={`mt-1 grid size-3.5 shrink-0 place-items-center rounded-full text-[8px] ${
                check.passed ? "bg-good/25 text-good" : "bg-bad/25 text-bad"
              }`}
            >
              {check.passed ? "\u2713" : "\u2717"}
            </span>
            <span className="text-[11px] leading-relaxed text-ink-muted">
              <span className="text-ink">{check.label}:</span> {check.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThumbnailStudio({ thumbnails }: { thumbnails: string[] }) {
  const [mode, setMode] = useState<Mode>("grid");

  const grades = useMemo(() => gradeAll(thumbnails), [thumbnails]);
  const best = useMemo(
    () => grades.reduce<ThumbnailGrade | null>((a, b) => (b.score > (a?.score ?? -1) ? b : a), null),
    [grades],
  );

  if (thumbnails.length === 0) {
    return (
      <div className="surface-solid rounded-2xl p-6 text-center">
        <p className="text-sm text-ink-muted">Run an analysis to generate thumbnail titles.</p>
        <p className="mt-1.5 text-xs text-ink-muted/70">
          Three options land here, each graded for length, contrast and safe zone.
        </p>
      </div>
    );
  }

  const yours = best ?? grades[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(["grid", "peek"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`rounded-lg px-3 py-1.5 text-[11px] transition ${
              mode === value ? "bg-accent/25 text-zinc-50" : "text-ink-muted hover:bg-white/5"
            }`}
          >
            {value === "grid" ? "Search grid" : "Next video peek"}
          </button>
        ))}
      </div>

      {mode === "grid" ? (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {RIVALS.slice(0, 6).map((rival, index) => (
              <ThumbnailFrame
                key={rival.title}
                {...rival}
                duration={`${1 + (index % 4)}:${String(10 + index * 7).slice(-2)}`}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-accent/40 p-2.5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-accent-2">
              Your entry, in the same grid
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {grades.map((grade, index) => (
                <ThumbnailFrame
                  key={grade.text}
                  title={grade.text}
                  hue={200 + index * 40}
                  words={grade.wordCount}
                  weight={900}
                  yours={index === 0}
                  duration="0:38"
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-ink-muted">
            Your cover sits beside eight competing thumbnails. What matters is whether it reads at a glance -
            the strongest entries here are short, all caps, and high weight.
          </p>
        </>
      ) : (
        <div className="flex justify-center">
          <div className="relative aspect-[9/19.5] w-full max-w-56 overflow-clip rounded-[1.7rem] border-[5px] border-neutral-900 bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />

            <div className="absolute inset-x-0 top-4 px-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">Currently watching</p>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-[46%]">
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-t from-transparent to-black/70" />
              <div className="relative h-full px-3 pt-3">
                <div className="flex gap-2">
                  <div className="relative aspect-[9/16] w-1/2 overflow-clip rounded-lg ring-1 ring-white/10">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(150deg, hsl(${200 + grades.length * 20} 70% 26%), hsl(240 65% 12%))`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center px-1">
                      <p
                        className="text-center uppercase leading-[0.95] text-white"
                        style={{
                          fontWeight: 900,
                          fontSize: `${Math.max(8, 20 - yours.wordCount * 2.4)}px`,
                          textShadow: "0 2px 5px rgba(0,0,0,0.95)",
                        }}
                      >
                        {yours.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 py-1">
                    <ThumbnailFrame
                      title={RIVALS[1].title}
                      hue={RIVALS[1].hue}
                      words={RIVALS[1].words}
                      weight={RIVALS[1].weight}
                      duration="0:52"
                    />
                    <ThumbnailFrame
                      title={RIVALS[4].title}
                      hue={RIVALS[4].hue}
                      words={RIVALS[4].words}
                      weight={RIVALS[4].weight}
                      duration="1:14"
                    />
                  </div>
                </div>
              </div>
            </div>

            <span className="absolute bottom-1 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[8px] tabular-nums text-white">
              0:38
            </span>

            <div
              className="absolute pointer-events-none border border-dashed border-accent-3/60"
              style={{
                left: `${THUMBNAIL_BLOCKS.duration.left}%`,
                top: `${THUMBNAIL_BLOCKS.duration.top}%`,
                right: `${THUMBNAIL_BLOCKS.duration.right}%`,
                bottom: `${THUMBNAIL_BLOCKS.duration.bottom}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Grading</p>
        {grades.map((grade) => (
          <GradePill key={grade.text} grade={grade} />
        ))}
      </div>
    </div>
  );
}