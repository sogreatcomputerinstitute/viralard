import type { Niche } from "./types";

import type { PillarScore } from "./types";

export type PillarConfig = {
  pillar: PillarScore["pillar"];
  max: number;
  nicheMultipliers?: Partial<Record<Niche, number>>;
};

export const PILLAR_MAX: Record<string, number> = {
  curiosity: 35,
  readability: 30,
  speed: 20,
  structure: 15,
};

export const NICHE_MULTIPLIERS: Partial<Record<Niche, Partial<Record<keyof typeof PILLAR_MAX, number>>>> = {
  finance: { curiosity: 1.15, readability: 1.2 },
  fitness: { curiosity: 1.1, speed: 1.05 },
  education: { curiosity: 1.2, readability: 0.9, speed: 0.9 },
  tech: { curiosity: 1.15, readability: 0.85 },
  comedy: { curiosity: 1.05, speed: 1.15, readability: 1.1 },
  gaming: { curiosity: 1.1, speed: 1.1 },
  food: { curiosity: 1.1, speed: 0.95 },
  fashion: { curiosity: 1.05, readability: 0.95 },
  beauty: { curiosity: 1.05, readability: 1.05 },
  business: { curiosity: 1.1, readability: 1.15 },
  lifestyle: { curiosity: 1.05 },
  general: {},
};

export function nicheMultiplier(niche: Niche, pillar: keyof typeof PILLAR_MAX): number {
  return NICHE_MULTIPLIERS[niche]?.[pillar] ?? 1;
}

export const NICHE_LABELS: Record<Niche, string> = {
  general: "General",
  finance: "Finance",
  fitness: "Fitness & Health",
  tech: "Tech & Gadgets",
  lifestyle: "Lifestyle",
  gaming: "Gaming",
  education: "Education",
  comedy: "Comedy",
  food: "Food",
  fashion: "Fashion",
  beauty: "Beauty",
  business: "Business",
};

export const PRO_NICHES: Niche[] = [
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