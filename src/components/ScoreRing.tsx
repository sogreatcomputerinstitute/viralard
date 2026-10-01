"use client";

import { useMemo } from "react";
import type { HookStrengthResult } from "@/lib/engine/types";

const BAND_STROKE: Record<HookStrengthResult["band"], string> = {
  strong: "var(--color-good)",
  workable: "var(--color-mid)",
  weak: "var(--color-bad)",
};

export function ScoreRing({ result, size = 168 }: { result: HookStrengthResult; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = result.total / 100;
  const offset = circumference * (1 - ratio);

  const gradientId = useMemo(() => `ring-${result.total}-${size}`, [result.total, size]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Hook strength ${result.total} out of 100`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={BAND_STROKE[result.band]} stopOpacity="0.65" />
            <stop offset="100%" stopColor={BAND_STROKE[result.band]} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-edge)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          className="animate-ring-draw"
          style={
            {
              "--ring-offset": `${circumference}`,
              "--ring-target": `${offset}`,
            } as React.CSSProperties
          }
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-semibold tabular-nums"
          style={{ color: BAND_STROKE[result.band] }}
        >
          {result.total}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Hook strength</span>
      </div>
    </div>
  );
}