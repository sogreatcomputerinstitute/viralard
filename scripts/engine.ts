import { NICHE_VALUES, type HookStrengthResult } from "../src/lib/engine/types";
import { scoreHook, analyzeNiche } from "../src/lib/engine/score";
import { generateRewrites, cacheKey } from "../src/lib/engine/analyze";
import { isGeminiConfigured } from "../src/lib/ai/gemini";

const SAMPLE: string[] = [
  "Hey guys welcome back to my channel today I am going to be talking about money",
  "Your first 3 seconds are wasted.",
  "Stop buying bitcoin on the hype.",
  "Here's why your first video flopped.",
  "The 3 things nobody tells you about making money online in 2026.",
  "I saved $4,200 in 90 days doing this and it is not what you think.",
  "um so basically you should maybe try to think about like budgeting or whatever",
];

function bar(earned: number, max: number, width = 18): string {
  const filled = max === 0 ? 0 : Math.round((earned / max) * width);
  return `${"#".repeat(filled)}${"-".repeat(width - filled)}`;
}

function report(result: HookStrengthResult): void {
  console.log("\n" + "=".repeat(72));
  console.log(result.text);
  console.log("=".repeat(72));
  console.log(`SCORE ${result.total}/100  [${result.band.toUpperCase()}]  ${result.charCount} chars, ${result.wordCount} words`);
  console.log(result.verdict);

  for (const [pillar, data] of Object.entries(result.pillars)) {
    console.log(`\n  ${pillar.padEnd(12)} ${String(data.earned).padStart(5)}/${data.max}  ${bar(data.earned, data.max)}`);
    for (const sig of data.signals) {
      const mark = sig.direction === "positive" ? "+" : "-";
      console.log(`    ${mark} ${sig.label}: ${sig.detail}`);
    }
  }

  if (result.advice.length > 0) {
    console.log("\n  NEXT:");
    for (const line of result.advice) console.log(`    - ${line}`);
  }
}

async function runRewriteDemo(text: string, niche: string): Promise<void> {
  const resolved = analyzeNiche(niche);
  console.log(`\n${"#".repeat(72)}`);
  console.log(`REWRITES  niche=${resolved}  cacheKey=${cacheKey(text, resolved).slice(0, 16)}...`);
  console.log("#".repeat(72));

  const rewrites = await generateRewrites(text, resolved);
  for (const rewrite of rewrites) {
    console.log(`\n[${rewrite.title}]  (${rewrite.text.length} chars)`);
    console.log(`  ${rewrite.text}`);
    console.log(`  why: ${rewrite.rationale}`);
  }
}

const [mode = "score", ...rest] = process.argv.slice(2);

async function main(): Promise<void> {
  if (mode === "niches") {
    console.log(NICHE_VALUES.join(", "));
    return;
  }

  if (mode === "score") {
    const samples = rest.length > 0 ? rest : SAMPLE;
    for (const sample of samples) report(scoreHook(sample));
    console.log("");
    return;
  }

  if (mode === "one") {
    const text = rest[0];
    if (!text) throw new Error('Usage: npm run engine -- one "your hook text" [niche]');
    report(scoreHook(text, analyzeNiche(rest[1])));
    console.log("");
    return;
  }

  if (mode === "rewrite") {
    const text = rest[0];
    if (!text) throw new Error('Usage: npm run engine -- rewrite "your hook text" [niche]');
    report(scoreHook(text, analyzeNiche(rest[1])));
    if (!isGeminiConfigured()) {
      console.log("\nGEMINI_API_KEY not set - skipping rewrites.");
      return;
    }
    await runRewriteDemo(text, rest[1] ?? "general");
    return;
  }

  throw new Error(`Unknown mode "${mode}". Try: score | one | rewrite | niches`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});