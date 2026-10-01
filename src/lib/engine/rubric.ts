import { createHash } from "node:crypto";
import { generateStructured } from "../ai/gemini";
import { LANGUAGE_DIRECTIVES, languageLabel, PERSONAS } from "./personas";
import { PATTERNS, PATTERN_TITLES } from "./patterns";
import { NICHE_LABELS } from "./config";
import {
  HOOK_MAX_CHARS,

  type Niche,
  type PatternId,
  type Rewrite,

} from "./types";
import { findPersona, type Persona } from "./personas";
import { clamp, normalize, round, tokenize } from "./text";

export const METRIC_MAX = 25;

export type MetricKey = "speed" | "readability" | "structure" | "curiosity";

export type MetricResult = {
  key: MetricKey;
  label: string;
  earned: number;
  max: number;
  notes: string[];
};

export type RubricResult = {
  total: number;
  metrics: Record<MetricKey, MetricResult>;
  personaId: string;
  personaLabel: string;
};

/** Personas move the speed band, so the thresholds cannot be module constants. */
const HIGH_PERFORMANCE_OPENERS = [
  "stop doing",
  "stop buying",
  "stop making",
  "stop posting",
  "stop wasting",
  "don't make this",
  "dont make this",
  "don't post",
  "dont post",
  "the biggest mistake",
  "the worst mistake",
  "the only way",
  "this one tool",
  "i stopped",
  "i quit",
  "why you are failing",
  "why you're failing",
  "why you keep failing",
  "the reason you",
];

const STANDARD_OPENERS = [
  "how to",
  "the secret way to",
  "secret way to",
  "this is how",
  "3 steps to",
  "three steps to",
  "the trick to",
  "the way to",
];

const BORING_INTROS = [
  "hey guys",
  "hey everyone",
  "hello everyone",
  "hi everyone",
  "in this video",
  "in todays video",
  "in today's video",
  "welcome back",
  "whats up",
  "what's up",
];

const HEDGES = ["maybe", "perhaps", "possibly", "i think", "kind of", "sort of", "somewhat", "hopefully"];

/** Jargon proxy: a word longer than this many characters. */
const LONG_WORD_CHARS = 8;

function countWords(text: string): number {
  return tokenize(text).length;
}

function scoreSpeed(text: string, max: number, persona: Persona): MetricResult {
  const words = countWords(text);
  const [low, high] = persona.rules.idealWords;
  const notes: string[] = [];
  let earned: number;

  if (words >= low && words <= high) {
    earned = max;
    notes.push(`${words} words - right for ${persona.label.toLowerCase()}`);
  } else if (words > high && words <= persona.rules.maxWords) {
    earned = 15;
    notes.push(`${words} words - above the ${high} word ceiling for this audience`);
  } else if (words > persona.rules.maxWords) {
    earned = 0;
    notes.push(`${words} words - past ${persona.rules.maxWords}, too slow for this audience`);
  } else {
    earned = 10;
    notes.push(`${words} words - under ${low}, too little context for this audience`);
  }

  if (words === 0) {
    earned = 0;
    notes.unshift("No words to score");
  }

  return { key: "speed", label: "Speed & Pacing", earned: clamp(earned, 0, max), max, notes };
}

function scoreReadability(text: string, max: number, persona: Persona): MetricResult {
  const notes: string[] = [];
  const words = tokenize(text);
  let earned = max;

const longWords = words.filter((word) => word.length > LONG_WORD_CHARS);
  if (longWords.length > 0) {
    const penalty = longWords.length * 5;
    earned -= penalty;
    notes.push(`Jargon: -${penalty} for ${longWords.length} word(s) over ${LONG_WORD_CHARS} characters (${longWords.join(", ")})`);
  }

  const formal = persona.rules.formalWords.filter((word) => {
    const lower = text.toLowerCase();
    return new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, "i").test(lower);
  });

  if (formal.length > 0) {
    const penalty = Math.min(12, formal.length * 4);
    earned -= penalty;
    notes.push(`Register: -${penalty} for ${persona.label} (${formal.join(", ")})`);
  }

  if (notes.length === 0) {
    notes.push("Short words, single clause, no register mismatch");
  }

  return { key: "readability", label: "Readability", earned: clamp(earned, 0, max), max, notes };
}

function startsWithAny(text: string, phrases: string[]): string | null {
  const lower = text.toLowerCase().trim().replace(/[.!?,;:]+$/, "");
  return phrases.find((phrase) => lower.startsWith(phrase)) ?? null;
}

function scoreStructure(text: string, max: number): MetricResult {
  const notes: string[] = [];
  let earned = 0;

  const high = startsWithAny(text, HIGH_PERFORMANCE_OPENERS);
  const standard = startsWithAny(text, STANDARD_OPENERS);

  if (high) {
    earned += max;
    notes.push(`High-performance opening: "${high}"`);
  } else if (standard) {
    earned += 10;
    notes.push(`Standard opening: "${standard}"`);
  } else {
    const words = countWords(text);
    const hedged = HEDGES.some((hedge) =>
      new RegExp(`(^|[^a-z])${hedge}([^a-z]|$)`, "i").test(text.toLowerCase()),
    );

    if (words > 0 && words <= 12 && !hedged && !text.includes("?")) {
      earned += 12;
      notes.push("Short declarative opener - interruptive even without a listed phrase");
    } else {
      notes.push("No recognised opening framework");
    }
  }

  const lower = text.toLowerCase();
  const boring = BORING_INTROS.find((phrase) => lower.includes(phrase));
  if (boring) {
    earned -= 15;
    notes.push(`Boring intro: -15 for "${boring}"`);
  }

  return { key: "structure", label: "Structure & Triggers", earned: clamp(earned, 0, max), max, notes };
}

function scoreCuriosity(text: string, max: number, persona: Persona): MetricResult {
  const notes: string[] = [];
  const lower = text.toLowerCase();
  const matched = new Set<string>();
  let hits = 0;

  for (const boost of persona.rules.boosts) {
    const found = boost.terms.find((term) =>
      term.length <= 2 ? lower.includes(term) : new RegExp(`(^|[^a-z])${term}([^a-z]|$)`, "i").test(lower),
    );

    if (found) {
      hits += 1;
      matched.add(boost.label);
      notes.push(`${boost.label}: "${found.trim()}"`);
    }
  }

  if (/\d/.test(text)) {
    hits += 1;
    notes.push("Number hook: contains a digit");
  }

  const secondPerson = ["you", "your", "you're", "you've"].find((token) =>
    new RegExp(`(^|[^a-z])${token}([^a-z]|$)`, "i").test(lower),
  );
  if (secondPerson) {
    hits += 1;
    notes.push(`Second person: "${secondPerson}"`);
  }

  const pointer = ["this", "that", "these", "here"].find((token) =>
    new RegExp(`(^|[^a-z])${token}([^a-z]|$)`, "i").test(lower),
  );
  if (pointer) {
    notes.push(`Pointer: "${pointer}" (never counts alone)`);
  }

  const earned = hits >= 2 ? max : hits === 1 ? 15 : 0;

  if (hits === 0) notes.push(`No ${persona.label.toLowerCase()} signals found`);
  if (hits === 1) notes.push("Only one signal - a partial open loop");

  return { key: "curiosity", label: "Curiosity Gap", earned, max, notes };
}

export function runRubric(text: string, personaId: string | null = null): RubricResult {
  const persona = findPersona(personaId) ?? PERSONAS_FALLBACK;

  const metrics = {
    speed: scoreSpeed(text, METRIC_MAX, persona),
    readability: scoreReadability(text, METRIC_MAX, persona),
    structure: scoreStructure(text, METRIC_MAX),
    curiosity: scoreCuriosity(text, METRIC_MAX, persona),
  };

  const total = round(
    Object.values(metrics).reduce((sum, metric) => sum + metric.earned, 0),
    0,
  );

  return {
    total: clamp(total, 0, 100),
    metrics,
    personaId: persona.id,
    personaLabel: persona.label,
  };
}

function buildPrompt(
  text: string,
  niche: Niche,
  persona: Persona | null,
  language: string,
): string {
  const patternBlock = PATTERNS.map(
    (p, i) => `[${i + 1}] ${p.title}\nGoal: ${p.goal}\nRule: ${p.instruction}`,
  ).join("\n\n");

  const personaBlock = persona
    ? `\nTARGET AUDIENCE - this overrides everything else:\n${persona.prompt}\nLength target: ${persona.rules.idealWords[0]} to ${persona.rules.idealWords[1]} words.\nAvoid register that alienates this audience.\n`
    : "";

  const languageDirective = LANGUAGE_DIRECTIVES[language];
  const languageBlock = languageDirective
    ? `\nOUTPUT LANGUAGE - ${languageLabel(language)}:\n${languageDirective}\nProduce the three rewrites in ${languageLabel(language)}, not English.\n`
    : "\nWrite all three rewrites in English.\n";

  return [
    "You rewrite the opening hook of short-form vertical video (TikTok, Reels, Shorts).",
    `Niche: ${NICHE_LABELS[niche]}.`,
    personaBlock,
    "Rewrite the source hook into exactly three alternatives, one per pattern below.",
    "Hard rules for every rewrite:",
    "- 45 characters maximum. This is non-negotiable and is what the tool enforces.",
    "- That length is what makes it speakable in about 3 seconds.",
    "- Must be speakable out loud in roughly 3 seconds.",
    languageBlock,
    "- Spoken register. No emoji, no hashtags, no camera directions, no quotation marks around the whole line.",
    "- No greeting or sign-off.",
    "- Preserve the creator's actual topic. Do not invent a new subject.",
    "",
    patternBlock,
    "",
    `Source hook: ${text}`,
    "",
    "Then suggest exactly three text-overlay titles for the video thumbnail.",
    "Hard rules for thumbnail titles:",
    "- Under 4 words each.",
    "- All caps, no emoji, no hashtags, no punctuation at the end.",
    "- Must be readable at thumbnail size, so keep every word short.",
    "",
    'Return JSON only, in this exact shape:',
    '{"rewrites":[{"pattern":"pattern_interrupt","text":"...","rationale":"..."}],"thumbnails":["...","...","..."]}',
    "Include all three pattern ids exactly once, in the order listed above, and exactly three thumbnails.",
  ].join("\n");
}

type RewritePayload = { pattern: PatternId; text: string; rationale: string };

function toRewrites(payload: RewritePayload[]): Rewrite[] {
  return PATTERNS.map((pattern) => {
    const match = payload.find((r) => r.pattern === pattern.id);
    return {
      pattern: pattern.id,
      title: PATTERN_TITLES[pattern.id],
      text: match ? normalize(match.text).slice(0, HOOK_MAX_CHARS) : "",
      rationale: match?.rationale ?? "",
    };
  });
}

export function cacheKey(
  text: string,
  niche: string,
  persona = "none",
  language = "none",
): string {
  return createHash("sha256")
    .update(`${normalize(text).toLowerCase()}::${niche}::${persona}::${language}::v3`)
    .digest("hex");
}



export async function generateRewrites(
  text: string,
  niche: Niche,
  personaId: string | null = null,
  language = "none",
): Promise<Rewrite[]> {
  const result = await generateRewritesAndThumbnails(text, niche, personaId, language);
  return result.rewrites;
}

export async function generateRewritesAndThumbnails(
  text: string,
  niche: Niche,
  personaId: string | null = null,
  language = "none",
): Promise<{ rewrites: Rewrite[]; thumbnails: string[] }> {
  const persona = findPersona(personaId);
  const payload = await generateStructured<{ rewrites?: RewritePayload[]; thumbnails?: string[] }>(
    buildPrompt(text, niche, persona, language),
    { maxOutputTokens: 1400 },
  );

  return {
    rewrites: toRewrites(payload.rewrites ?? []),
    thumbnails: (payload.thumbnails ?? []).filter((t) => typeof t === "string").slice(0, 3),
  };
}

const PERSONAS_FALLBACK = PERSONAS[0];
