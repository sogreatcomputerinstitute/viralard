export type PersonaTier = "free" | "pro";

export type BoostTerm = {
  label: string;
  terms: string[];
};

/**
 * Personas change the rubric, not just the rewrite prompt. A hook pitched at a
 * 19-year-old gamer and one pitched at a CFO are scored against different
 * expectations, so the word-count band, the formality penalty and the bonus
 * terms all move.
 */
export type PersonaRules = {
  /** Ideal spoken length for this audience, in words. */
  idealWords: [number, number];
  /** Beyond this the hook is too slow for the audience. */
  maxWords: number;
  /** Words that read as formal or corporate. Penalised for audiences that hate them. */
  formalWords: string[];
  /** Concepts this audience actually responds to. */
  boosts: BoostTerm[];
  /** Shown in the sidebar so the rules are not hidden. */
  summary: string;
};

export type Persona = {
  id: string;
  label: string;
  prompt: string;
  tier: PersonaTier;
  rules: PersonaRules;
};

const FORMAL_WORDS = [
  "furthermore",
  "moreover",
  "utilise",
  "utilize",
  "leverage",
  "ascend",
  "endeavour",
  "therefore",
  "consequently",
  "aforementioned",
  "methodology",
  "synergy",
  "paradigm",
  "robust",
  "scalable",
];

export const PERSONAS: Persona[] = [
  {
    id: "none",
    label: "Standard / General Audience",
    prompt: "",
    tier: "free",
    rules: {
      idealWords: [5, 11],
      maxWords: 15,
      formalWords: [],
      boosts: [
        { label: "Open loop", terms: ["why", "how", "here's why", "the reason"] },
        { label: "Strong claim", terms: ["garbage", "wrong", "nobody", "everyone", "never"] },
        { label: "Specific number", terms: ["$", "%", "3", "7", "90"] },
      ],
      summary: "The baseline rubric. Short, direct, no audience assumptions.",
    },
  },
  {
    id: "genz-gamers",
    label: "Gen-Z Gamers",
    prompt:
      "Rewrite for Gen-Z gamers: fast, irreverent, competitive. Use gaming and internet culture shorthand. No corporate formality, no long setup. Energy like a clutch moment.",
    tier: "pro",
    rules: {
      idealWords: [4, 8],
      maxWords: 11,
      formalWords: FORMAL_WORDS,
      boosts: [
        { label: "High energy", terms: ["insane", "crazy", "brutal", "goated", "wild", "literally"] },
        { label: "Competitive", terms: ["beat", "win", "clutch", "ranked", "pro", "noob"] },
        { label: "Reaction", terms: ["bro", "fr", "ngl", "wait", "why", "when"] },
      ],
      summary: "Punishes formal language, caps at 8 words, rewards high-energy interrupts.",
    },
  },
  {
    id: "tech-founders",
    label: "Tech Founders",
    prompt:
      "Rewrite for tech founders: dense, technical, contrarian. Assume they know what a moat is. Lead with the uncomfortable truth.",
    tier: "pro",
    rules: {
      idealWords: [7, 16],
      maxWords: 22,
      formalWords: [],
      boosts: [
        { label: "Business metric", terms: ["revenue", "churn", "mrr", "arr", "margin", "burn"] },
        { label: "Scale language", terms: ["scale", "scaling", "throughput", "infrastructure", "hosting"] },
        { label: "Friction", terms: ["latency", "downtime", "cost", "$0", "bottleneck", "rewrite"] },
      ],
      summary: "Allows longer sentences. Rewards metrics, scale language and named friction.",
    },
  },
  {
    id: "corporate-managers",
    label: "Corporate Managers",
    prompt:
      "Rewrite for corporate managers: concise, evidence-led, outcome-first. Cut all hype language. Lead with the business result, then the method.",
    tier: "pro",
    rules: {
      idealWords: [6, 13],
      maxWords: 18,
      formalWords: ["literally", "insane", "crazy", "wild", "bro", "goated"],
      boosts: [
        { label: "Business outcome", terms: ["saved", "reduced", "improved", "recovered", "cut"] },
        { label: "Evidence", terms: ["%", "study", "data", "average", "teams", "quarter"] },
        { label: "Cost of inaction", terms: ["every week", "each quarter", "lost", "risk"] },
      ],
      summary: "Hype language is penalised. Rewards business outcomes and evidence.",
    },
  },
  {
    id: "parents",
    label: "Busy Parents",
    prompt:
      "Rewrite for busy parents: warm, practical, reassuring. Address the daily reality of juggling everything. No guilt-tripping.",
    tier: "pro",
    rules: {
      idealWords: [6, 13],
      maxWords: 17,
      formalWords: FORMAL_WORDS,
      boosts: [
        { label: "Stress trigger", terms: ["tired", "exhausted", "no time", "again", "still doing", "fighting"] },
        { label: "Time saving", terms: ["in 5 minutes", "one thing", "finally", "without", "no more"] },
        { label: "Relief", terms: ["works", "finally", "breathe", "easier", "less"] },
      ],
      summary: "Searches for stress triggers and time-saving promises. Penalises jargon.",
    },
  },
  {
    id: "nigerian-creators",
    label: "Nigerian Creators",
    prompt:
      "Rewrite for Nigerian creators: use natural Nigerian English and Pidgin where it lands. Local references, price points in naira, local slang. Not stiff translated English.",
    tier: "pro",
    rules: {
      idealWords: [5, 12],
      maxWords: 16,
      formalWords: FORMAL_WORDS,
      boosts: [
        { label: "Local reference", terms: ["naira", "naira", "abuja", "lagos", "naija", "nigeria"] },
        { label: "Local price", terms: ["k", "m", "million", "thousand"] },
        { label: "Pidgin register", terms: ["dey", "get", "abeg", "sharp sharp", "e no be"] },
      ],
      summary: "Rewards naira price points and natural Pidgin. Penalises stiff translated English.",
    },
  },
  {
    id: "first-time-buyers",
    label: "First-time Buyers",
    prompt:
      "Rewrite for first-time buyers: remove jargon entirely, name the fear directly, make the risk concrete and the payoff specific.",
    tier: "pro",
    rules: {
      idealWords: [6, 13],
      maxWords: 17,
      formalWords: FORMAL_WORDS,
      boosts: [
        { label: "Fear named", terms: ["afraid", "scared", "worry", "risk", "mistake", "wasted"] },
        { label: "Concrete payoff", terms: ["you get", "you save", "guaranteed", "proven", "step by step"] },
        { label: "Reassurance", terms: ["safe", "simple", "no experience", "beginner", "start"] },
      ],
      summary: "Zero jargon allowed. Rewards naming the fear and a concrete payoff.",
    },
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