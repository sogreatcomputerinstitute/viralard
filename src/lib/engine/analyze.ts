import { createHash } from "node:crypto";
import { PATTERNS, PATTERN_TITLES } from "./patterns";
import { NICHE_LABELS } from "./config";
import {
  HOOK_MAX_CHARS,
  type AnalyzeResponse,
  type AnalyzeRequest,
  type PatternId,
  type Rewrite,
} from "./types";
import { scoreHook, analyzeNiche } from "./score";
import { normalize } from "./text";
import { findPersona, LANGUAGE_DIRECTIVES, languageLabel, type Persona } from "./personas";
import { DEFAULT_MODEL, generateStructured, isGeminiConfigured } from "../ai/gemini";

export function cacheKey(text: string, niche: string, persona = "none", language = "none"): string {
  return createHash("sha256")
    .update(`${normalize(text).toLowerCase()}::${niche}::${persona}::${language}::v2`)
    .digest("hex");
}

type RewritePayload = { pattern: PatternId; text: string; rationale: string };

function buildPrompt(
  text: string,
  niche: ReturnType<typeof analyzeNiche>,
  persona: Persona | null,
  language: string,
): string {
  const patternBlock = PATTERNS.map(
    (p, i) => `[${i + 1}] ${p.title}\nGoal: ${p.goal}\nRule: ${p.instruction}`,
  ).join("\n\n");

  const personaBlock = persona
    ? `\nTARGET AUDIENCE - this overrides everything else:\n${persona.prompt}\n`
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
    "- Prefer 5 to 9 words. Cut every word that does not earn its place.",
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

export type GenerateOptions = {
  personaId?: string | null;
  language?: string;
  useCache?: boolean;
  cache?: Map<string, AnalyzeResponse>;
};

export async function analyzeHook(
  request: AnalyzeRequest & { personaId?: string | null; language?: string },
  options: GenerateOptions = {},
): Promise<AnalyzeResponse> {
  const niche = analyzeNiche(request.niche);
  const personaId = options.personaId ?? null;
  const language = options.language ?? "none";

  const strength = scoreHook(request.text, niche);
  const key = cacheKey(request.text, niche, personaId ?? "none", language);
  const cache = options.cache;

  if (options.useCache !== false && cache?.has(key)) {
    return { ...(cache.get(key) as AnalyzeResponse), cached: true };
  }

  const rewrites = await generateRewrites(strength.text, niche, personaId, language);

  const response: AnalyzeResponse = { strength, rewrites, cached: false, model: DEFAULT_MODEL };

  if (cache) cache.set(key, response);
  return response;
}

export async function generateRewrites(
  text: string,
  niche: ReturnType<typeof analyzeNiche>,
  personaId: string | null = null,
  language = "none",
): Promise<Rewrite[]> {
  const result = await generateRewritesAndThumbnails(text, niche, personaId, language);
  return result.rewrites;
}

type FullGeneration = { rewrites: Rewrite[]; thumbnails: string[] };

export async function generateRewritesAndThumbnails(
  text: string,
  niche: ReturnType<typeof analyzeNiche>,
  personaId: string | null = null,
  language = "none",
): Promise<FullGeneration> {
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

export { isGeminiConfigured };