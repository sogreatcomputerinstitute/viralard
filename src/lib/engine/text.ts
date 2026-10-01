const VOWEL_GROUPS = /[aeiouy]+/g;

export function normalize(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2014\u2013]/g, "-")
    .trim();
}

export function tokenize(input: string): string[] {
  const matches = normalize(input).toLowerCase().match(/[a-z0-9']+/g);
  return matches ?? [];
}

export function sentences(input: string): string[] {
  const cleaned = normalize(input);
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countSyllablesInWord(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;

  const working = w
    .replace(/(?:[^laeiouy]es|[^laeiouy]e)$/, "")
    .replace(/^y/, "");

  const trimmed = working.replace(/e$/, "");
  const groups = (trimmed.length > 0 ? trimmed : working).match(VOWEL_GROUPS);

  return groups ? groups.length : 1;
}

export function countSyllables(input: string): number {
  return tokenize(input).reduce((total, word) => total + countSyllablesInWord(word), 0);
}

export function fleschReadingEase(input: string): number {
  const words = tokenize(input);
  const sents = sentences(input);
  if (words.length === 0 || sents.length === 0) return 0;

  const syllables = countSyllables(input);
  const wordsPerSentence = words.length / sents.length;
  const syllablesPerWord = syllables / words.length;

  return 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const wordPatternCache = new Map<string, RegExp>();

export function wordPattern(phrase: string): RegExp {
  const cached = wordPatternCache.get(phrase);
  if (cached) return cached;
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase.toLowerCase())}($|[^a-z0-9])`, "i");
  wordPatternCache.set(phrase, pattern);
  return pattern;
}

export type Marker = {
  re: RegExp;
  label: string;
};

export function word(...labels: string[]): Marker[] {
  return labels.map((label) => ({ re: wordPattern(label), label }));
}

export function phrase(re: RegExp, label: string): Marker[] {
  return [{ re, label }];
}

export function findMarkers(haystack: string, markers: readonly Marker[]): Marker[] {
  return markers.filter((marker) => marker.re.test(haystack));
}