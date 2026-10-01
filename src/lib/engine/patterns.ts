export type PatternDefinition = {
  id: "pattern_interrupt" | "negative_frame" | "curiosity_loop";
  title: string;
  goal: string;
  instruction: string;
  example: string;
};

export const PATTERNS: PatternDefinition[] = [
  {
    id: "pattern_interrupt",
    title: "Pattern Interrupt",
    goal: "Break the viewer's expectation of what a normal opening looks like.",
    instruction:
      "Open with something abrupt that could not start a normal video: a hard claim, a single dramatic word, or a direct challenge to the viewer. No greeting, no setup.",
    example: "Your first 3 seconds are wasted.",
  },
  {
    id: "negative_frame",
    title: "Negative Frame",
    goal: "Name the mistake or loss the viewer is currently making.",
    instruction:
      "Tell the viewer they are doing something wrong or losing something, using never/stop/wrong framing, then imply the fix exists. Keep it under one sentence.",
    example: "Stop buying bitcoin on the hype.",
  },
  {
    id: "curiosity_loop",
    title: "Curiosity Loop",
    goal: "Open a loop the viewer needs closed, without closing it in the hook.",
    instruction:
      "State that a surprising result or hidden reason exists but hold back the explanation. Use here is why / the reason / what I found framing and do not resolve it.",
    example: "Here's why your first video flopped.",
  },
];

export const PATTERN_TITLES: Record<PatternDefinition["id"], string> = PATTERNS.reduce(
  (acc, pattern) => ({ ...acc, [pattern.id]: pattern.title }),
  {} as Record<PatternDefinition["id"], string>,
);