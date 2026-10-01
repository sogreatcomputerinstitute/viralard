import { NICHE_VALUES, type Band, type HookStrengthResult, type Niche, type PillarScore, type ScorePillar, HOOK_MAX_CHARS } from "./types";
import { nicheMultiplier, NICHE_LABELS } from "./config";
import { runRubric } from "./rubric";
import { clamp, normalize, round, tokenize } from "./text";

const PILLAR_ORDER: ScorePillar[] = ["curiosity", "readability", "speed", "structure"];

/**
 * Recalibrated against the four-metric rubric. Thresholds were set by measuring
 * the distribution on the sample set rather than picked up front, so "strong"
 * stays a meaningful claim instead of something most copy clears.
 */
function bandFor(total: number): Band {
  if (total >= 80) return "strong";
  if (total >= 50) return "workable";
  return "weak";
}

function verdictFor(total: number, band: Band): string {
  if (band === "strong") return "Strong hook. This clears the first-frame bar most creators miss.";
  if (band === "workable") return "Workable but leaky. One structural fix should move the needle.";
  return "Weak. The viewer has no reason to stay past the first frame.";
}

function adviceFor(pillars: Record<ScorePillar, PillarScore>): string[] {
  const ranked = PILLAR_ORDER.map((p) => ({ p, ratio: pillars[p].max === 0 ? 1 : pillars[p].earned / pillars[p].max })).sort(
    (a, b) => a.ratio - b.ratio,
  );

  const advice: string[] = [];
  for (const { p } of ranked.slice(0, 2)) {
    if (pillars[p].earned === pillars[p].max) continue;
    const negatives = pillars[p].signals.filter((s) => s.direction === "negative");
    if (negatives.length > 0) {
      advice.push(`Fix ${negatives[0].label.toLowerCase()}: ${negatives[0].detail}.`);
    } else {
      advice.push(`Strengthen ${p}: ${pillars[p].earned}/${pillars[p].max} is the lowest pillar.`);
    }
  }
  return advice.slice(0, 3);
}

export function scoreHook(
  text: string,
  niche: Niche = "general",
  personaId: string | null = null,
): HookStrengthResult {
  const cleaned = normalize(text).slice(0, HOOK_MAX_CHARS);
  const truncated = normalize(text).length > HOOK_MAX_CHARS;

  const rubric = runRubric(cleaned, personaId);
  const personaActive = rubric.personaId !== "none";

  const pillars = {} as Record<ScorePillar, PillarScore>;

  for (const pillar of PILLAR_ORDER) {
    const metric = rubric.metrics[pillar];
    const max = round(metric.max * nicheMultiplier(niche, pillar), 1);
    const ratio = metric.max === 0 ? 0 : metric.earned / metric.max;

    pillars[pillar] = {
      pillar,
      earned: round(max * ratio, 1),
      max,
      signals: metric.notes.map((note) => ({
        pillar,
        label: metric.label,
        detail: note,
        direction: "positive" as const,
        weight: 0,
      })),
    };
  }

  const total = clamp(rubric.total, 0, 100);
  const band = bandFor(total);
  const signals = PILLAR_ORDER.flatMap((p) => pillars[p].signals);
  const notes: string[] = [];
  if (niche !== "general") notes.push(`Niche: ${NICHE_LABELS[niche]}`);
  if (personaActive) notes.push(`Scored for ${rubric.personaLabel}`);
  const contextNote = notes.length > 0 ? ` ${notes.join(" - ")}.` : "";

  return {
    text: cleaned,
    charCount: cleaned.length,
    wordCount: tokenize(cleaned).length,
    total,
    band,
    pillars,
    signals,
    verdict: verdictFor(total, band) + contextNote + (truncated ? " Text was cut at 250 characters." : ""),
    advice: adviceFor(pillars),
  };
}

export function analyzeNiche(value: unknown): Niche {
  return typeof value === "string" && (NICHE_VALUES as string[]).includes(value) ? (value as Niche) : "general";
}