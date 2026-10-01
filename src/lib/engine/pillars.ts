import {
  clamp,
  countSyllablesInWord,
  findMarkers,
  fleschReadingEase,
  phrase,
  round,
  sentences,
  tokenize,
  word,
  type Marker,
} from "./text";
import type { PillarConfig } from "./config";
import type { PillarScore, ScoreSignal } from "./types";

const CURIOSITY_OPENERS = word(
  "here's why",
  "here's how",
  "here's what",
  "here's the",
  "let me explain",
  "i was wrong",
  "stop doing",
  "nobody tells you",
  "nobody talks about",
  "the truth about",
  "what i learned",
  "what nobody",
  "this is why",
  "you've been told",
  "watch what happens",
  "watch this",
);

const QUESTION_MARKERS = word(
  "why",
  "how",
  "what if",
  "what happens",
  "which one",
  "who else",
  "when should",
  "where do",
);

const SPECIFICITY_MARKERS: Marker[] = [
  ...phrase(/\$|\u20ac|\u00a3|\bpercent\b|\bx more\b|\btimes more\b/, "a currency figure"),
  ...phrase(/\b\d[\d,.]*\s*(?:k|m|bn|million|billion|thousand)\b/i, "a rounded number"),
  ...phrase(
    /\b\d[\d,.]*\s*(?:second|seconds|sec|secs|minute|minutes|min|mins|hour|hours|day|days|week|weeks|month|months|year|years)\b/i,
    "a time span",
  ),
  ...phrase(/\bstep (?:1|one|two|2|three|3)\b/i, "a numbered step"),
  ...phrase(/\b(?:a|per|every) (?:day|week|month|year)\b/i, "a repeat frequency"),
  ...word("double", "triple", "halved"),
];

const NEGATIVE_FRAME = word(
  "stop",
  "don't",
  "do not",
  "never",
  "wrong",
  "mistake",
  "worst",
  "fail",
  "failed",
  "ruined",
  "broke",
  "fake",
  "lie",
  "lies",
  "scam",
  "nobody",
  "without",
  "avoid",
  "quit",
  "wasted",
  "wasting",
  "losing",
  "lost",
  "killing",
  "killed",
  "harmful",
  "dangerous",
  "painful",
);

/**
 * Strong claims and absolutes create a knowledge gap. These carry the tension
 * that keyword matching misses on short, punchy lines like "Your intro is
 * garbage" which are structurally strong but lexically empty.
 */
const CLAIM_MARKERS = word(
  "garbage",
  "trash",
  "useless",
  "pointless",
  "dead",
  "overrated",
  "underrated",
  "everyone",
  "nobody",
  "nobody's",
  "always",
  "everyone's",
  "the only",
  "the real",
  "the truth",
  "the problem",
  "the reason",
  "the secret",
  "biggest",
  "worst",
  "best",
  "hardest",
  "easiest",
  "every single",
  "no one",
  "not a single",
  "unpopular",
  "expensive",
  "cheap",
  "massive",
  "tiny",
  "impossible",
  "brutal",
  "terrible",
  "perfect",
  "ridiculous",
  "insane",
  "crazy",
);

const HEDGES = word(
  "maybe",
  "perhaps",
  "possibly",
  "i think",
  "kind of",
  "sort of",
  "somewhat",
  "usually",
  "generally",
  "sometimes",
  "might",
  "could be",
  "or something",
  "or whatever",
  "hopefully",
);

const VAGUE_FILLER = word(
  "um",
  "uh",
  "so basically",
  "you know",
  "sort of",
  "kind of",
  "or something",
  "or whatever",
);

const LONG_WORD_THRESHOLD = 3;
const READABILITY_TARGET = 75;

const WEAK_OPENERS = word(
  "hey guys",
  "hello everyone",
  "hi everyone",
  "what's up",
  "welcome back",
  "so today",
  "today i'm going to",
  "in today's video",
  "just wanted to",
);

const SECOND_PERSON = word("you", "your", "yourself", "you're", "you've", "you'll");

const DIRECT_MARKERS = word("stop", "try", "start", "get", "don't", "never", "before", "after", "avoid", "quit");

function signal(
  pillar: ScoreSignal["pillar"],
  label: string,
  detail: string,
  direction: ScoreSignal["direction"],
  weight: number,
): ScoreSignal {
  return { pillar, label, detail, direction, weight };
}

/**
 * A short declarative line is a pattern interrupt in itself. "Your intro is
 * garbage" carries real tension with no keywords at all, so without this the
 * curiosity pillar reads 0/35 on exactly the lines a rewriter produces.
 */
function isAssertiveOneLiner(text: string): boolean {
  const words = tokenize(text);
  if (words.length === 0 || words.length > 9) return false;
  if (findMarkers(text, HEDGES).length > 0) return false;
  if (findMarkers(text, VAGUE_FILLER).length > 0) return false;
  if (text.includes("?")) return false;
  return /[.!?]$/.test(text.trim());
}

function scoreCuriosity(text: string, max: number): { earned: number; signals: ScoreSignal[] } {
  const signals: ScoreSignal[] = [];
  let earned = 0;

  const openers = findMarkers(text, CURIOSITY_OPENERS);
  if (openers.length > 0) {
    earned += 9;
    signals.push(signal("curiosity", "Curiosity opener", `Uses "${openers[0].label}"`, "positive", 9));
  }

  const questions = findMarkers(text, QUESTION_MARKERS);
  if (questions.length > 0) {
    earned += 8;
    signals.push(signal("curiosity", "Question hook", `Asks "${questions[0].label}"`, "positive", 8));
  }

  if (text.includes("?")) {
    earned += 4;
    signals.push(signal("curiosity", "Question mark", "Leaves a question open", "positive", 4));
  }

  const specifics = findMarkers(text, SPECIFICITY_MARKERS);
  if (specifics.length > 0) {
    earned += 7;
    signals.push(
      signal(
        "curiosity",
        "Specificity",
        `Concrete detail: ${specifics.map((m) => m.label).join(", ")}`,
        "positive",
        7,
      ),
    );
  }

  const negatives = findMarkers(text, NEGATIVE_FRAME);
  if (negatives.length > 0) {
    earned += 6;
    signals.push(
      signal("curiosity", "Negative frame", `Confronts "${negatives[0].label}"`, "positive", 6),
    );
  }

  const claims = findMarkers(text, CLAIM_MARKERS);
  if (claims.length > 0) {
    earned += 6;
    signals.push(
      signal("curiosity", "Strong claim", `Provocative wording "${claims[0].label}"`, "positive", 6),
    );
  }

  if (isAssertiveOneLiner(text)) {
    earned += 12;
    signals.push(
      signal("curiosity", "Pattern interrupt", "Short, blunt, no hedging", "positive", 12),
    );
  }

  const filler = findMarkers(text, VAGUE_FILLER);
  if (filler.length > 0) {
    earned -= 5;
    signals.push(
      signal(
        "curiosity",
        "Filler language",
        `"${filler.map((m) => m.label).join(", ")}" softens the hook`,
        "negative",
        -5,
      ),
    );
  }

  const wordCount = tokenize(text).length;
  if (wordCount >= 25) {
    earned -= 6;
    signals.push(signal("curiosity", "Too long for a hook", `${wordCount} words`, "negative", -6));
  }

  return { earned: clamp(earned, 0, max), signals };
}

function scoreReadability(text: string, max: number): { earned: number; signals: ScoreSignal[] } {
  const signals: ScoreSignal[] = [];
  const ease = fleschReadingEase(text);
  const words = tokenize(text);

  let earned = clamp(ease >= READABILITY_TARGET ? max : (ease / READABILITY_TARGET) * max, 0, max);

  signals.push(
    signal(
      "readability",
      "Reading level",
      `Flesch ease ${round(ease, 1)} (${ease >= READABILITY_TARGET ? "easy enough to speak fast" : `aim for ${READABILITY_TARGET}+`})`,
      earned === max ? "positive" : "negative",
      round(earned, 1),
    ),
  );

  const longWords = words.filter((word) => countSyllablesInWord(word) >= LONG_WORD_THRESHOLD);
  if (longWords.length > 0) {
    const ratio = longWords.length / words.length;
    const penalty = clamp(ratio * max * 0.6, 0, max * 0.4);
    earned = clamp(earned - penalty, 0, max);
    signals.push(
      signal(
        "readability",
        "Complex words",
        `${longWords.length} multi-syllable word(s): ${longWords.slice(0, 3).join(", ")}`,
        "negative",
        -round(penalty, 1),
      ),
    );
  }

  const sentenceList = sentences(text);
  if (sentenceList.length > 1) {
    const longest = sentenceList.reduce((best, s) => Math.max(best, tokenize(s).length), 0);
    if (longest > 14) {
      earned = clamp(earned - 3, 0, max);
      signals.push(
        signal("readability", "Run-on line", `${longest} words before a full stop`, "negative", -3),
      );
    }
  }

  return { earned, signals };
}

const SPEECH_CHARS_PER_SECOND = 15;

/**
 * Reframed. The original peaked at exactly 3s and punished anything snappier,
 * which meant every rewrite the model produced scored worse than its own input.
 * Short is not a defect in a hook - it lands fast. The only real failure mode
 * is a line that takes too long to get to the point.
 */
const SPEED_COMFORT_LOW = 1.2;
const SPEED_COMFORT_HIGH = 4.2;
const SPEED_LONG_LIMIT = 6.5;

function scoreSpeed(text: string, max: number): { earned: number; signals: ScoreSignal[] } {
  const signals: ScoreSignal[] = [];
  const charCount = normalize(text).length;
  const durationSeconds = charCount / SPEECH_CHARS_PER_SECOND;

  let earned: number;
  let tone: ScoreSignal["direction"];

  if (durationSeconds < SPEED_COMFORT_LOW) {
    earned = clamp((durationSeconds / SPEED_COMFORT_LOW) * max * 0.92, 0, max);
    tone = "negative";
  } else if (durationSeconds <= SPEED_COMFORT_HIGH) {
    earned = max;
    tone = "positive";
  } else {
    const overage = durationSeconds - SPEED_COMFORT_HIGH;
    const span = SPEED_LONG_LIMIT - SPEED_COMFORT_HIGH;
    const ratio = span <= 0 ? 1 : clamp(overage / span, 0, 1);
    earned = clamp(max * (1 - ratio * 0.85), 0, max);
    tone = "negative";
  }

  signals.push(
    signal(
      "speed",
      "Read time",
      `~${round(durationSeconds, 1)}s spoken (${tone === "positive" ? "lands fast" : durationSeconds < SPEED_COMFORT_LOW ? "very short" : "too slow to land"})`,
      tone,
      round(earned, 1),
    ),
  );

  return { earned, signals };
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function scoreStructure(text: string, max: number): { earned: number; signals: ScoreSignal[] } {
  const signals: ScoreSignal[] = [];
  let earned = 0;

  const weak = findMarkers(text, WEAK_OPENERS);
  if (weak.length > 0) {
    earned -= 8;
    signals.push(
      signal("structure", "Weak opening", `Starts with "${weak[0].label}"`, "negative", -8),
    );
  } else {
    earned += 6;
    signals.push(signal("structure", "Direct opening", "Dives straight in", "positive", 6));
  }

  const secondPerson = findMarkers(text, SECOND_PERSON);
  if (secondPerson.length > 0) {
    earned += 5;
    signals.push(signal("structure", "Speaks to viewer", "Uses second person", "positive", 5));
  }

  const direct = findMarkers(text, DIRECT_MARKERS);
  if (direct.length > 0) {
    earned += 4;
    signals.push(
      signal("structure", "Imperative voice", `Direct phrasing "${direct[0].label}"`, "positive", 4),
    );
  }

  const wordCount = tokenize(text).length;
  if (wordCount > 0 && wordCount <= 7) {
    earned += 5;
    signals.push(
      signal("structure", "Punchy length", `${wordCount} words, one breath`, "positive", 5),
    );
  }

  return { earned: clamp(earned, 0, max), signals };
}

const BUILDERS: Record<
  PillarConfig["pillar"],
  (text: string, max: number) => { earned: number; signals: ScoreSignal[] }
> = {
  curiosity: scoreCuriosity,
  readability: scoreReadability,
  speed: scoreSpeed,
  structure: scoreStructure,
};

export function scorePillars(
  text: string,
  config: PillarConfig & { pillar: PillarConfig["pillar"] },
): PillarScore {
  const builder = BUILDERS[config.pillar];
  const { earned, signals } = builder(text, config.max);
  return { pillar: config.pillar, earned: round(earned, 1), max: config.max, signals };
}

export function spokenDuration(text: string): number {
  return round(normalize(text).length / SPEECH_CHARS_PER_SECOND, 1);
}