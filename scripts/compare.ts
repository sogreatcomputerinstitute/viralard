import { runRubric } from "../src/lib/engine/rubric";
import { scoreHook } from "../src/lib/engine/score";

const SAMPLES = [
  "Your first 3 seconds are wasted.",
  "Here's why your first video flopped.",
  "Stop buying bitcoin on the hype.",
  "Your intro is garbage.",
  "The 3 things nobody tells you about making money online in 2026.",
  "I saved $4,200 in 90 days doing this and it is not what you think.",
  "Hey guys welcome back to my channel today I am going to be talking about money",
  "um so basically you should maybe try to think about like budgeting or whatever",
  "The biggest mistake founders make when raising money",
  "This one tool replaced my entire editing workflow",
];

type Row = { text: string; newTotal: number; oldTotal: number; worst: string };

function main() {
  const rows: Row[] = [];

  console.log(
    `${"hook".padEnd(52)}${"NEW".padStart(5)}${"OLD".padStart(5)}${"delta".padStart(7)}  weakest metric`,
  );
  console.log("-".repeat(105));

  for (const text of SAMPLES) {
    const next = runRubric(text);
    const previous = scoreHook(text);

    const metrics = Object.values(next.metrics);
    const worst = metrics.reduce((a, b) => (a.earned / a.max < b.earned / b.max ? a : b));

    const label = text.length > 50 ? `${text.slice(0, 50)}...` : text;
    const delta = next.total - previous.total;

    console.log(
      `${label.padEnd(52)}${String(next.total).padStart(5)}${String(previous.total).padStart(5)}${
        (delta > 0 ? `+${delta}` : String(delta)).padStart(7)
      }  ${worst.label} ${worst.earned}/${worst.max}`,
    );

    rows.push({ text, newTotal: next.total, oldTotal: previous.total, worst: worst.label });
  }

  console.log("\n--- detail ---\n");

  for (const text of SAMPLES) {
    const next = runRubric(text);
    console.log(`"${text.length > 70 ? `${text.slice(0, 70)}...` : text}"  ->  ${next.total}/100`);

    for (const metric of Object.values(next.metrics)) {
      console.log(`    ${metric.label.padEnd(22)} ${String(metric.earned).padStart(3)}/${metric.max}`);
      for (const note of metric.notes) console.log(`        ${note}`);
    }
    console.log("");
  }

  const inversions = rows.filter((row) => {
    const wasBetter = row.oldTotal >= 70;
    const nowWorse = row.newTotal < 55;
    return wasBetter && nowWorse;
  });

  console.log("--- flags ---");
  if (inversions.length === 0) {
    console.log("No hook that was strong under the old rubric collapses under the new one.");
  } else {
    console.log(`${inversions.length} hook(s) lose their strong rating:`);
    for (const row of inversions) {
      console.log(`  "${row.text.slice(0, 60)}"  ${row.oldTotal} -> ${row.newTotal} (weakest: ${row.worst})`);
    }
  }
}

main();