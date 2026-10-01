"use client";

import { useMemo, useState } from "react";
import { PLATFORM_VALUES, SAFE_ZONES, type Platform, type SafeZoneRect } from "@/lib/safezone";
import { VIDEO_THEMES, contrastRatio } from "@/lib/contrast";
import { describeBlindSpots, findBlindSpots } from "@/lib/blindspot";
import { scoreHook } from "@/lib/engine/score";

function style(rect: SafeZoneRect) {
  return {
    top: `${rect.top ?? 0}%`,
    right: `${rect.right ?? 0}%`,
    bottom: `${rect.bottom ?? 0}%`,
    left: `${rect.left ?? 0}%`,
  };
}

const RAIL_ICONS = [
  "M9 15.5 3.4 10a3.3 3.3 0 0 1 4.7-4.6L9 6.3l.9-.9A3.3 3.3 0 0 1 14.6 10Z",
  "M3 4.5h12v8H8.4L5 15v-2.5H3Z",
  "M5 3.5h8v12l-4-3-4 3Z",
];

const RAIL_COUNTS = ["2.4K", "184", "912", "57"];

const META: Record<Platform, { handle: string; caption: string }> = {
  tiktok: { handle: "@yourhandle", caption: "nobody talks about this part 1" },
  reels: { handle: "yourhandle", caption: "the hook that finally worked" },
  shorts: { handle: "Your Channel", caption: "try this instead" },
};

/**
 * Static phone preview of the analysed footage inside a real platform frame.
 * No scroll simulation - this answers "would the app's own UI cover my text",
 * which is the question a still frame actually answers.
 */
export function VideoPhonePreview({
  videoUrl,
  onScreenText,
  transcript,
}: {
  videoUrl: string;
  onScreenText: string;
  transcript: string;
}) {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const mask = SAFE_ZONES[platform];

  const hookLine = (onScreenText || transcript).trim();

  const placement = useMemo(
    () => ({ line: hookLine, textLeftPct: 6, textWidthPct: 66, topPct: 60 }),
    [hookLine],
  );

  const spots = useMemo(() => findBlindSpots(placement, platform), [placement, platform]);
  const report = useMemo(() => describeBlindSpots(spots), [spots]);
  const chars = Array.from(hookLine);

  const contrastFails = VIDEO_THEMES.filter((theme) => contrastRatio("#ffffff", theme.surface) < 3).length;

  const score = hookLine.length >= 8 ? scoreHook(hookLine).total : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">Feed preview</p>
        <div className="flex gap-1">
          {PLATFORM_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPlatform(value)}
              aria-pressed={platform === value}
              className={`rounded-lg px-2.5 py-1 text-[11px] capitalize transition ${
                platform === value ? "bg-accent/25 text-zinc-50" : "text-ink-muted hover:bg-white/5"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="relative aspect-[9/19.5] w-full max-w-56 overflow-clip rounded-[1.7rem] border-[5px] border-neutral-900 bg-black shadow-xl shadow-black/60"
        >
          <video src={videoUrl} muted playsInline loop autoPlay className="absolute inset-0 size-full object-cover" />

          {Object.entries(mask.blocked).map(([key, rect]) => (
            <div key={key} className="absolute bg-accent/30" style={style(rect)} />
          ))}
          {Object.entries(mask.blocked).map(([key, rect]) => (
            <div
              key={`${key}-line`}
              className="absolute border border-dashed border-accent-3/70"
              style={style(rect)}
            />
          ))}

          <div className="absolute right-1.5 bottom-16 z-20 flex flex-col items-center gap-3 text-white">
            <div className="grid size-9 place-items-center rounded-full border-2 border-white bg-white/15">
              <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="6" r="3.2" fill="currentColor" />
                <path d="M2.8 17c.6-3.3 3.1-5 6.2-5s5.6 1.7 6.2 5" fill="currentColor" />
              </svg>
            </div>

            {RAIL_ICONS.map((path, index) => (
              <div key={index} className="flex flex-col items-center">
                <svg width="19" height="19" viewBox="0 0 18 18" aria-hidden="true">
                  <path d={path} fill="currentColor" />
                </svg>
                <span className="text-[8px] tabular-nums text-white/90">{RAIL_COUNTS[index]}</span>
              </div>
            ))}

            <svg width="19" height="19" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M9 3.5v9M9 3.5 6 6.6M9 3.5l3 3.1M4 12v3h10v-3"
                stroke="currentColor"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {hookLine ? (
            <div
              className="absolute z-10"
              style={{ top: placement.topPct, left: `${placement.textLeftPct}%`, width: `${placement.textWidthPct}%` }}
            >
              <p className="text-left text-[13px] font-semibold leading-tight text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                {chars.map((char, index) => {
                  const inSpot = spots.some((span) => index >= span.start && index < span.end);

                  return (
                    <span
                      key={index}
                      className={inSpot ? "rounded-[2px] bg-bad/85" : undefined}
                      style={inSpot ? { boxShadow: "0 0 0 2px rgba(251,113,133,0.4)" } : undefined}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 z-10 px-[5%] pb-3 pr-[20%]">
            <p className="text-[10px] font-semibold text-white drop-shadow">{META[platform].handle}</p>
            <p className="text-[9px] text-white/85 drop-shadow">{META[platform].caption}</p>
          </div>

          {score !== null ? (
            <div className="absolute right-2 top-2 z-20 rounded-full bg-black/45 px-2 py-0.5 backdrop-blur-sm">
              <span className="text-[10px] font-semibold tabular-nums text-white">{score}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className={`surface-solid rounded-xl p-3 ${report.clean ? "border-good/30" : "border-bad/40"}`}>
          <p className="text-xs font-medium text-ink">
            {report.clean ? "UI blind spot: clear" : "UI blind spot detected"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{report.message}</p>
        </div>

        <div className="surface-solid rounded-xl p-3">
          <p className="text-xs font-medium text-ink">Caption contrast</p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            White text fails on{" "}
            <span className="text-bad">
              {contrastFails} of {VIDEO_THEMES.length}
            </span>{" "}
            standard backgrounds. Add a scrim or drop shadow before publishing.
          </p>
        </div>
      </div>
    </div>
  );
}