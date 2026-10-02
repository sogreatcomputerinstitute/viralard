/**
 * Algorithmic guardrail screening.
 *
 * READ THIS BEFORE RELYING ON IT.
 *
 * This is a static heuristic, not an authoritative compliance check. Platforms do
 * not publish machine-readable rule sets, suppression is driven by classifier
 * models rather than keyword matching, and these policies change without notice.
 * A green result means "nothing in this list matched", not "this is safe".
 *
 * Where the tiers come from:
 * - "suppress" reflects language that is frequently restricted for organic
 *   distribution, mostly health and financial claims.
 * - "adRisk" reflects the better-documented commercial rules, chiefly Meta's
 *   Special Ad Categories and its restriction on asserting personal attributes.
 *   Content in this tier usually survives organically and fails as a promoted
 *   post.
 *
 * Every rule carries a suggested rewrite. The tool exists to be acted on, and a
 * flag with no exit is just a nag.
 */

export type Severity = "suppress" | "adRisk";

export type RuleCategory =
  | "financial"
  | "medical"
  | "cosmetics"
  | "personal-attribute"
  | "copyright"
  | "misleading"
  | "get-rich-quick"
  | "solicitation";

export type ComplianceRule = {
  id: string;
  label: string;
  category: RuleCategory;
  severity: Severity;
  /** Matched against the whole line, word-boundary anchored. */
  patterns: RegExp[];
  /** A wording swap that keeps the meaning and drops the trigger. */
  suggestion?: string;
  note: string;
};

/**
 * Pinned to the rule set, not the date. Bumping it forces a deliberate review
 * rather than silently inheriting stale rules.
 */
export const RULESET_VERSION = "2026.10-a";

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  financial: "Financial claim",
  medical: "Medical claim",
  cosmetics: "Cosmetic claim",
  "personal-attribute": "Personal attribute",
  copyright: "Copyright",
  misleading: "Misleading",
  "get-rich-quick": "Get rich quick",
  solicitation: "Solicitation",
};

export const COMPLIANCE_RULES: ComplianceRule[] = [
  // ---------------------------------------------------------------- suppress
  {
    id: "instant-income",
    label: "Instant income claim",
    category: "financial",
    severity: "suppress",
    patterns: [
      /make \$?\d[\d,]*\s*(a day|per day|daily|fast|quick)/i,
      /make \$?\d[\d,]*\s*(a week|per week|this week)/i,
      /\$\d[\d,]*\s*(a day|per day)\s*(passive|income|cash)/i,
      /passive income of \$/i,
    ],
    suggestion: "Lead with the mechanism and the timeframe: \"the exact steps I used to cut my monthly costs\".",
    note: "Specific income-per-timeframe figures are a primary trigger for financial spam classification.",
  },
  {
    id: "guaranteed-money",
    label: "Guaranteed financial result",
    category: "financial",
    severity: "suppress",
    patterns: [/\bguaranteed (income|money|profit|returns?|cash|roi)\b/i, /\brisk[- ]free (money|investment|returns?)\b/i],
    suggestion: "Replace the guarantee with an honest qualifier: \"in my experience\" or \"here is what changed\".",
    note: "Guarantees about financial outcomes are prohibited as a matter of policy, not judgement.",
  },
  {
    id: "get-rich-quick",
    label: "Get rich quick framing",
    category: "get-rich-quick",
    severity: "suppress",
    patterns: [
      /\b(get rich|go from broke|become rich)\b/i,
      /\bmake money (while you sleep|on autopilot|in your sleep)\b/i,
      /\bturn \$\d+ into \$\d+\b/i,
      /\b(secret|hidden) (wealth|money) formula\b/i,
    ],
    suggestion: "Describe the specific process rather than the outcome: \"what I changed in my pricing\".",
    note: "Wealth-transformation framing is heavily weighted in spam distribution models.",
  },
  {
    id: "medical-cure",
    label: "Disease or condition cure claim",
    category: "medical",
    severity: "suppress",
    patterns: [
      /\b(cure|cures|cured|curing|heal|heals|healed|reverse|reverses|reversed)\s+(your\s+|my\s+|our\s+)?(anxiety|depression|diabetes|cancer|eczema|asthma|migraine|insomnia|acne|fatigue|pain|infection)\b/i,
      /\b(cure|cures|cured|heal|heals|healed)\s+(it|them|this)\s*(away|out)?\b/i,
      /\b(treat|treats|treated|treating)\s+(your\s+|my\s+)?(anxiety|depression|diabetes|insomnia|pain)\b/i,
      /\b(diagnose|diagnoses|diagnosing)\s+(your\s+|my\s+)?\b/i,
      /\b100% effective\b/i,
      /\b(eliminates?|removes?) (all )?(my\s+|your\s+)?(symptoms?|pain|acne|spots?)\b/i,
    ],
    suggestion: "Describe the experience without the clinical claim: \"what helped me manage mornings\".",
    note: "Medical claims are restricted for organic content on every major platform, regardless of disclaimers.",
  },
  {
    id: "supplement-claim",
    label: "Supplement efficacy claim",
    category: "medical",
    severity: "suppress",
    patterns: [
      /\b(supplement|supplements)\s+(that|which)\s+(cure|cures|fix|fixes|reverse|reverses|boosts immunity)\b/i,
      /\b(detox|detoxify|cleanse your)\b/i,
      /\bboosts? (your\s+)?immunity\b/i,
      /\bmelts? fat\b/i,
      /\blose weight (fast|instantly|quickly)\b/i,
    ],
    suggestion: "Frame it as a routine or habit rather than an efficacy claim.",
    note: "Supplement and weight-loss efficacy language is restricted even with a health disclaimer attached.",
  },
  {
    id: "cosmetic-guarantee",
    label: "Guaranteed cosmetic result",
    category: "cosmetics",
    severity: "suppress",
    patterns: [
      /\bguaranteed (results?|youth|skin|hair)\b/i,
      /\b(wrinkle|acne|hair loss) (cure|treatment)\b/i,
      /\blook (10|20|30) years younger\b/i,
      /\bpermanent (hair|facial)\b/i,
      /\b(skin|hair|face|body|teeth)\s+transformed\b/i,
      /\bcompletely (eliminated|removed|got rid of) (my|our|your) (acne|wrinkles|spots?)\b/i,
    ],
    suggestion: "Show the routine instead of promising an outcome.",
    note: "Before-and-after cosmetic claims are limited to substantiated results on most platforms.",
  },
  {
    id: "copyright-marked",
    label: "Copyrighted material reference",
    category: "copyright",
    severity: "suppress",
    patterns: [
      /\b(free|full) (movie|film|song|album|episode)\b/i,
      /\b(mp3|mp4|blu-ray)\s?(download|rip)\b/i,
      /\b(stream|watch)\s+(it\s+)?(free|without paying)\b/i,
      /\b(lyrics|transcript)\s+from\b/i,
    ],
    suggestion: "Link to the official source and say so explicitly.",
    note: "Explicit references to pirated or unlicensed media attract both automated and rights-holder claims.",
  },
  {
    id: "misleading-urgency",
    label: "Artificial urgency or scarcity",
    category: "misleading",
    severity: "suppress",
    patterns: [
      /\bact now\b/i,
      /\blimited time only\b/i,
      /\b(only|just) \d+ (left|remaining|spots?)\b/i,
      /\beveryone is (buying|doing|using)\b/i,
      /\bdo not miss out\b/i,
      /\bexclusive access\b/i,
    ],
    suggestion: "Replace the pressure with a concrete detail about why this matters.",
    note: "Coordinated urgency across a channel is a strong distribution-level signal.",
  },

  // ----------------------------------------------------------------- adRisk
  {
    id: "personal-attribute",
    label: "Asserts a personal attribute",
    category: "personal-attribute",
    severity: "adRisk",
    patterns: [
      /\bare you (struggling|dealing|looking for)\b/i,
      /\bdo you (struggle|deal|suffer)\b/i,
      /\b(suffering from|struggling with) (your|you)\b/i,
      /\bfor (people|anyone) (over|under|with) \w+/i,
    ],
    suggestion: "Describe the situation without addressing the viewer as a category: \"the 6pm routine that stuck\".",
    note: "Meta prohibits asserting personal attributes in ads, including negative ones. Usually fine organically.",
  },
  {
    id: "special-ad-category",
    label: "Special Ad Category topic",
    category: "financial",
    severity: "adRisk",
    patterns: [
      /\b(debt|credit score|credit card|loan|mortgage|insurance)\b/i,
      /\b(anxiety|addiction|recovery|mental health)\b/i,
      /\b(job|hiring|employment|career)\b/i,
      /\b(weight loss|eczema|acne) (tip|tips|cream|guide)\b/i,
    ],
    suggestion: "Expect to need a pre-approved Special Ad Category before this can run as a promoted post.",
    note: "Topics that map to Meta's credit, employment, housing, health or social-issues categories require declaration.",
  },
  {
    id: "before-after",
    label: "Before and after framing",
    category: "misleading",
    severity: "adRisk",
    patterns: [/\bbefore and after\b/i, /\bday 1 vs day \d+\b/i, /\btransform(ation)? (in|after) \d+ (days|weeks|months)\b/i],
    suggestion: "Describe the process. Show the change rather than claiming it.",
    note: "Permitted organically with clear disclosure, but restricted for most paid placements.",
  },
  {
    id: "testimonial",
    label: "Testimonial or results framing",
    category: "misleading",
    severity: "adRisk",
    patterns: [
      /\b(they|people|everyone) (used|love|swear by)\b/i,
      /\b(results? (may )?vary)\b/i,
      /\bin \d+ days (i|we) lost\b/i,
    ],
    suggestion: "Present it as your own documented process rather than an aggregate claim.",
    note: "Testimonials and typical-results claims are heavily restricted in paid social.",
  },
  {
    id: "external-solicitation",
    label: "Off-platform solicitation",
    category: "solicitation",
    severity: "adRisk",
    patterns: [
      /\b(click|tap) (the )?link in (my |the )?(bio|description)\b/i,
      /\b(dm|message) (me|us) (for|to)\b/i,
      /\bwhats?app (me|us)\b/i,
      /\b(bit|eth) ?\.?(coin)?\s*(wallet|address)\b/i,
    ],
    suggestion: "Keep the call to action on-platform for the promoted version.",
    note: "Common in organic content but a frequent cause of ad rejection and downranking.",
  },
];

export type ComplianceHit = {
  rule: ComplianceRule;
  matched: string;
  index: number;
};

export type ComplianceReport = {
  version: string;
  hits: ComplianceHit[];
  suppressCount: number;
  adRiskCount: number;
  level: "clear" | "adRisk" | "suppress";
  headline: string;
  detail: string;
};

function findHit(text: string, rule: ComplianceRule): ComplianceHit | null {
  for (const pattern of rule.patterns) {
    const match = pattern.exec(text);
    if (match && match[0].trim().length > 0) {
      return { rule, matched: match[0].trim(), index: match.index };
    }
  }
  return null;
}

/**
 * Character spans that tripped a rule, so the UI can highlight the exact words
 * rather than reporting a count.
 */
export function complianceSpans(hits: ComplianceHit[]): { start: number; end: number }[] {
  return hits.map((hit) => ({ start: hit.index, end: hit.index + hit.matched.length }));
}

export function scanCompliance(text: string): ComplianceReport {
  const hits: ComplianceHit[] = [];

  for (const rule of COMPLIANCE_RULES) {
    const hit = findHit(text, rule);
    if (hit) hits.push(hit);
  }

  hits.sort((a, b) => a.index - b.index);

  const suppressCount = hits.filter((hit) => hit.rule.severity === "suppress").length;
  const adRiskCount = hits.filter((hit) => hit.rule.severity === "adRisk").length;

  let level: ComplianceReport["level"] = "clear";
  let headline = "No restricted language detected";
  let detail =
    "Nothing in this rule set matched. That is not a compliance guarantee - platform classifiers change without notice.";

  if (suppressCount > 0) {
    level = "suppress";
    headline = `${suppressCount} phrase${suppressCount === 1 ? "" : "s"} flagged for distribution risk`;
    detail =
      "These commonly suppress organic reach on their own. Rework them before you pay for an edit or a creator day.";
  } else if (adRiskCount > 0) {
    level = "adRisk";
    headline = `${adRiskCount} phrase${adRiskCount === 1 ? "" : "s"} will hurt as a paid ad`;
    detail =
      "Fine as organic content, but expect rejection or restriction if this is promoted. Plan the paid variant separately.";
  }

  return { version: RULESET_VERSION, hits, suppressCount, adRiskCount, level, headline, detail };
}

export function suggestionsFor(hits: ComplianceHit[]): ComplianceRule[] {
  const seen = new Set<string>();
  return hits
    .filter((hit) => hit.rule.suggestion && !seen.has(hit.rule.id))
    .filter((hit) => {
      seen.add(hit.rule.id);
      return true;
    })
    .map((hit) => hit.rule);
}