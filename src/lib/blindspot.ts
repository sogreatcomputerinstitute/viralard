import { contrastRatio } from "./contrast";
import { SAFE_ZONES, type Platform, type SafeZoneRect } from "./safezone";

export type BlindSpotSpan = {
  start: number;
  end: number;
  region: string;
};

export type Placement = {
  line: string;
  textLeftPct: number;
  textWidthPct: number;
  topPct: number;
};

function rectsOverlap(a: Placement, b: SafeZoneRect): boolean {
  const lineTop = a.topPct;
  const lineBottom = a.topPct + 12;
  const blockedTop = b.top ?? 0;
  const blockedBottom = 100 - (b.bottom ?? 0);
  const blockedLeft = b.left ?? 0;
  const blockedRight = 100 - (b.right ?? 0);

  const vertical = lineTop < blockedBottom && lineBottom > blockedTop;
  const horizontal = a.textLeftPct < blockedRight && a.textLeftPct + a.textWidthPct > blockedLeft;

  return vertical && horizontal;
}

/**
 * Finds which characters of the hook fall inside a region the platform covers
 * with its own UI. Rather than a vague "your text is risky", this returns the
 * exact character range so the simulator can paint those letters red.
 */
export function findBlindSpots(placement: Placement, platform: Platform): BlindSpotSpan[] {
  const mask = SAFE_ZONES[platform];
  const spans: BlindSpotSpan[] = [];
  const chars = Array.from(placement.line);

  if (chars.length === 0) return spans;

  for (const [region, rect] of Object.entries(mask.blocked)) {
    if (!rectsOverlap(placement, rect)) continue;

    const blockedLeft = rect.left ?? 0;
    const blockedRight = 100 - (rect.right ?? 0);
    const spanStartPct = blockedLeft - placement.textLeftPct;
    const spanEndPct = blockedRight - placement.textLeftPct;

    const start = Math.max(0, Math.floor((spanStartPct / placement.textWidthPct) * chars.length));
    const end = Math.min(chars.length, Math.ceil((spanEndPct / placement.textWidthPct) * chars.length));

    if (end > start) {
      spans.push({ start, end, region });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}

export type BlindSpotReport = {
  clean: boolean;
  spans: BlindSpotSpan[];
  message: string;
};

export function describeBlindSpots(spans: BlindSpotSpan[]): BlindSpotReport {
  if (spans.length === 0) {
    return {
      clean: true,
      spans,
      message: "Clear of native UI on every platform we model.",
    };
  }

  const regions = [...new Set(spans.map((span) => span.region))].join(" and ");
  const hidden = [
    ...new Set(
      spans.flatMap((span) =>
        Array.from({ length: span.end - span.start }, (_, index) => span.start + index),
      ),
    ),
  ];

  return {
    clean: false,
    spans,
    message: `Characters ${hidden.map((index) => index + 1).join(", ")} sit under the ${regions} overlay. Shift the line or shorten it.`,
  };
}

/*
 * Ordered most legible first, so the first candidate to hit a perfect pass rate
 * wins and we never trade readability for a slightly prettier white.
 */
const CANDIDATES = ["#ffffff", "#f8fafc", "#fef3c7", "#fde68a", "#fca5a5", "#c4b5fd"];

export function bestCaptionColor(
  themes: { surface: string }[],
): { color: string; passRate: number } {
  let best = CANDIDATES[0];
  let bestPasses = -1;

  for (const candidate of CANDIDATES) {
    const passes = themes.filter((theme) => contrastRatio(candidate, theme.surface) >= 3).length;

    if (passes > bestPasses) {
      bestPasses = passes;
      best = candidate;
      if (bestPasses === themes.length) break;
    }
  }

  return { color: best, passRate: Math.round((bestPasses / themes.length) * 100) };
}