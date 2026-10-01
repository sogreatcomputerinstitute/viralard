import { VIDEO_THEMES, contrastRatio, contrastWithShadow, WCAG_AA_LARGE } from "./contrast";

/**
 * Thumbnail grading. Same philosophy as the hook rubric: pure JavaScript, zero
 * API calls, reproducible. The model only writes the words - every judgement
 * here is arithmetic.
 */

export const THUMBNAIL_MAX_WORDS = 4;

/**
 * Search and profile grids draw their own furniture over thumbnails. Different
 * from the in-feed safe zone, so it gets its own model rather than reusing
 * SAFE_ZONES, which describes video playback chrome.
 */
export const THUMBNAIL_BLOCKS = {
  /** Duration pill, bottom right. */
  duration: { left: 74, top: 80, right: 0, bottom: 0 },
  /** Truncated title row beneath the frame. */
  title: { left: 0, top: 100, right: 0, bottom: 0 },
  /** Row above when a grid is cut off mid-scroll. */
  edge: { left: 0, top: 0, right: 0, bottom: 92 },
} as const;

export type ThumbnailCheckId = "length" | "contrast" | "safeZone";

export type ThumbnailCheck = {
  id: ThumbnailCheckId;
  label: string;
  passed: boolean;
  detail: string;
};

export type ThumbnailGrade = {
  text: string;
  wordCount: number;
  score: number;
  checks: ThumbnailCheck[];
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function checkLength(text: string): ThumbnailCheck {
  const wordCount = countWords(text);
  const passed = wordCount > 0 && wordCount <= THUMBNAIL_MAX_WORDS;

  return {
    id: "length",
    label: "Length",
    passed,
    detail: passed
      ? `${wordCount} word${wordCount === 1 ? "" : "s"} - readable at grid size`
      : wordCount === 0
        ? "Empty"
        : `${wordCount} words - over the ${THUMBNAIL_MAX_WORDS} word limit, unreadable on a fast scroll`,
  };
}

/**
 * Reports the honest split: what clears with no help versus what clears once the
 * drop shadow is applied. A bare-white title that only works with the shadow is
 * a pass with a caveat, not a clean pass - creators strip shadows for "cleaner"
 * looks and then lose the text on any bright frame.
 */
export function checkContrast(text: string, color = "#ffffff"): ThumbnailCheck {
  const bare = VIDEO_THEMES.filter((theme) => contrastRatio(color, theme.surface) < WCAG_AA_LARGE).length;
  const shadowed = VIDEO_THEMES.filter(
    (theme) => contrastWithShadow(color, theme.surface) < WCAG_AA_LARGE,
  ).length;

  const total = VIDEO_THEMES.length;
  const passed = text.trim().length > 0 && shadowed === 0;

  const detail =
    shadowed === 0
      ? bare === 0
        ? `Clears all ${total} background themes on its own - no shadow required`
        : `Fails on ${bare} of ${total} themes unassisted, clears all ${total} once the drop shadow is applied. Keep the shadow.`
      : `Still fails on ${shadowed} of ${total} themes even with a shadow. Put a solid scrim behind the text.`;

  return { id: "contrast", label: "Contrast", passed, detail };
}

/**
 * Assumes the creator centres the text, the way every generator recommends. The
 * check is about the font size relative to the frame: a short line renders
 * large and safe, a long one shrinks to fit and spills toward the duration
 * pill.
 */
export function checkSafeZone(text: string): ThumbnailCheck {
  const wordCount = countWords(text);

  // Approximate rendered height as a share of the frame. Longer copy wraps.
  const coverage = Math.min(0.62, (wordCount * 0.09) + (text.length * 0.004));
  const bottomEdge = 50 + coverage * 50;
  const durationTop = THUMBNAIL_BLOCKS.duration.top;

  const passed = bottomEdge <= durationTop + 6;

  return {
    id: "safeZone",
    label: "Safe zone",
    passed,
    detail: passed
      ? `Text sits above the duration pill, occupying roughly ${Math.round(coverage * 100)}% of the frame`
      : `Text reaches ${Math.round(bottomEdge)}% down the frame and will collide with the duration badge`,
  };
}

export function gradeThumbnail(text: string, color = "#ffffff"): ThumbnailGrade {
  const checks = [checkLength(text), checkContrast(text, color), checkSafeZone(text)];
  const passed = checks.filter((check) => check.passed).length;

  return {
    text,
    wordCount: countWords(text),
    score: Math.round((passed / checks.length) * 100),
    checks,
  };
}

export function gradeAll(texts: string[]): ThumbnailGrade[] {
  return texts.filter((text) => text.trim().length > 0).map((text) => gradeThumbnail(text));
}

/** Keeps the copy tight. The generator is instructed for 4 words, not 3. */
export const THUMBNAIL_GENERATOR_RULES = [
  "Under 4 words each.",
  "All caps, no emoji, no hashtags, no trailing punctuation.",
  "Every word short. This renders as the largest element on the thumbnail.",
  "Concrete over clever. \"STOP BUYING HYPE\" beats \"YOU WONT BELIEVE THIS\".",
  "Never reuse the hook word for word. The tap should promise something new.",
];