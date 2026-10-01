export type PersonaTier = "free" | "pro";

export type Persona = {
  id: string;
  label: string;
  prompt: string;
  tier: PersonaTier;
};

export const PERSONAS: Persona[] = [
  {
    id: "none",
    label: "No specific persona",
    prompt: "",
    tier: "free",
  },
  {
    id: "genz-gamers",
    label: "Gen-Z Gamers",
    prompt:
      "Rewrite for Gen-Z gamers: fast, irreverent, competitive. Use gaming and internet culture shorthand. No corporate formality, no long setup. Energy like a clutch moment.",
    tier: "free",
  },
  {
    id: "corporate-managers",
    label: "Corporate Managers",
    prompt:
      "Rewrite for corporate managers: concise, evidence-led, outcome-first. Cut all hype language. Lead with the business result, then the method.",
    tier: "free",
  },
  {
    id: "parents",
    label: "Stay-at-home Parents",
    prompt:
      "Rewrite for stay-at-home parents: warm, practical, reassuring. Address the daily reality of juggling everything. No guilt-tripping.",
    tier: "free",
  },
  {
    id: "tech-founders",
    label: "Tech Founders",
    prompt:
      "Rewrite for tech founders: dense, technical, contrarian. Assume they know what a moat is. Lead with the uncomfortable truth.",
    tier: "pro",
  },
  {
    id: "nigerian-creators",
    label: "Nigerian Creators",
    prompt:
      "Rewrite for Nigerian creators: use natural Nigerian English and Pidgin where it lands. Local references, price points in naira, local slang. Not stiff translated English.",
    tier: "pro",
  },
  {
    id: "first-time-buyers",
    label: "First-time Buyers",
    prompt:
      "Rewrite for first-time buyers: remove jargon entirely, name the fear directly, make the risk concrete and the payoff specific.",
    tier: "pro",
  },
];

export function personasFor(plan: "free" | "pro"): Persona[] {
  return PERSONAS.filter((persona) => plan === "pro" || persona.tier === "free");
}

export function findPersona(id: string | null | undefined): Persona | null {
  if (!id) return null;
  return PERSONAS.find((persona) => persona.id === id) ?? null;
}

export const LANGUAGES = [
  { id: "none", label: "English only" },
  { id: "es", label: "Spanish" },
  { id: "pt", label: "Portuguese (Brazil)" },
  { id: "fr", label: "French" },
  { id: "de", label: "German" },
  { id: "pcm-NG", label: "Pidgin (Nigeria)" },
  { id: "yo", label: "Yoruba" },
  { id: "ha", label: "Hausa" },
  { id: "ig", label: "Igbo" },
  { id: "sw", label: "Swahili" },
  { id: "hi", label: "Hindi" },
  { id: "ar", label: "Arabic" },
  { id: "zh-CN", label: "Chinese (Simplified)" },
  { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" },
  { id: "tr", label: "Turkish" },
  { id: "ru", label: "Russian" },
  { id: "id", label: "Indonesian" },
  { id: "vi", label: "Vietnamese" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export function languageLabel(id: string): string {
  return LANGUAGES.find((language) => language.id === id)?.label ?? id;
}

/**
 * Each value carries the adaptation instruction. "Translate the hook" alone gets
 * you literal, dead phrasing - the words are correct and the hook stops
 * working. Every entry tells the model what to preserve and what to change.
 */
export const LANGUAGE_DIRECTIVES: Record<string, string> = {
  es: "Rewrite in Latin American or Castilian Spanish as appropriate for the region. Keep the structure and tension of the original; do not translate word-for-word.",
  pt: "Rewrite in Brazilian Portuguese. Keep colloquial and direct - formal Brazilian Portuguese kills a hook.",
  fr: "Rewrite in French. Keep it short and punchy; avoid passive constructions.",
  de: "Rewrite in German. German hooks work when concrete, so name the specific object or action.",
  "pcm-NG": "Rewrite in Nigerian Pidgin. Natural spoken register only - not textbook Pidgin, not Nigerian Standard English.",
  yo: "Rewrite in Yoruba using natural diacritics and everyday spoken Yoruba rather than formal literary Yoruba.",
  ha: "Rewrite in Hausa using everyday spoken Hausa, including the tilde / ɓ / ɗ / ƙ / ʄ and / ɓ characters as spoken.",
  ig: "Rewrite in Igbo using everyday spoken Igbo rather than formal literary Igbo.",
  sw: "Rewrite in Swahili. Keep the structure; Swahili is concise, so do not pad.",
  hi: "Rewrite in Hindi using Devanagari. Hinglish words work well here when natural.",
  ar: "Rewrite in Modern Standard Arabic with natural spoken phrasing where it fits.",
  "zh-CN": "Rewrite in Simplified Chinese. Keep it under 15 characters per idea - Chinese hooks must be extremely compressed.",
  ja: "Rewrite in Japanese. Keep it short and polite-neutral; avoid keigo stiffness in a hook.",
  ko: "Rewrite in Korean. Hooks work best in 반말 or casual polite register.",
  tr: "Rewrite in Turkish. Turkish agglutination makes long hooks worse, so compress hard.",
  ru: "Rewrite in Russian. Keep it punchy; avoid long subordinate clauses.",
  id: "Rewrite in Indonesian. Keep it short and informal.",
  vi: "Rewrite in Vietnamese. Tone marks matter for hook energy - keep it punchy.",
};