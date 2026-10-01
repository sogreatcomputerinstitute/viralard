export const HOOK_MAX_CHARS = 250;

export type Niche =
  | "general"
  | "finance"
  | "fitness"
  | "tech"
  | "lifestyle"
  | "gaming"
  | "education"
  | "comedy"
  | "food"
  | "fashion"
  | "beauty"
  | "business";

export const NICHE_VALUES: Niche[] = [
  "general",
  "finance",
  "fitness",
  "tech",
  "lifestyle",
  "gaming",
  "education",
  "comedy",
  "food",
  "fashion",
  "beauty",
  "business",
];

export function isNiche(value: unknown): value is Niche {
  return typeof value === "string" && (NICHE_VALUES as string[]).includes(value);
}

export type PatternId = "pattern_interrupt" | "negative_frame" | "curiosity_loop";

export type ScorePillar = "curiosity" | "readability" | "speed" | "structure";

export type SignalDirection = "positive" | "negative";

export type ScoreSignal = {
  pillar: ScorePillar;
  label: string;
  detail: string;
  direction: SignalDirection;
  weight: number;
};

export type PillarScore = {
  pillar: ScorePillar;
  earned: number;
  max: number;
  signals: ScoreSignal[];
};

export type HookStrengthResult = {
  text: string;
  charCount: number;
  wordCount: number;
  total: number;
  band: Band;
  pillars: Record<ScorePillar, PillarScore>;
  signals: ScoreSignal[];
  verdict: string;
  advice: string[];
};

export type Band = "strong" | "workable" | "weak";

export type Rewrite = {
  pattern: PatternId;
  title: string;
  text: string;
  rationale: string;
};

export type AnalyzeRequest = {
  text: string;
  niche?: Niche;
};

export type AnalyzeResponse = {
  strength: HookStrengthResult;
  rewrites: Rewrite[];
  cached: boolean;
  model: string;
  thumbnails?: string[];
};