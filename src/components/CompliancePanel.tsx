"use client";

import { useMemo } from "react";
import {
  CATEGORY_LABELS,
  complianceSpans,
  scanCompliance,
  suggestionsFor,
  type ComplianceReport,
} from "@/lib/compliance";

const LEVEL_STYLE: Record<ComplianceReport["level"], { chip: string; bar: string; label: string }> = {
  clear: {
    chip: "border-good/40 bg-good/10 text-good",
    bar: "bg-good",
    label: "Clear",
  },
  adRisk: {
    chip: "border-mid/40 bg-mid/10 text-mid",
    bar: "bg-mid",
    label: "Ad risk",
  },
  suppress: {
    chip: "border-bad/40 bg-bad/10 text-bad",
    bar: "bg-bad",
    label: "Distribution risk",
  },
};

export function CompliancePanel({ text }: { text: string }) {
  const report = useMemo(() => scanCompliance(text), [text]);

  const chars = useMemo(() => Array.from(text), [text]);
  const spans = useMemo(() => complianceSpans(report.hits), [report.hits]);

  const style = LEVEL_STYLE[report.level];
  const suggestions = useMemo(() => suggestionsFor(report.hits), [report.hits]);

  if (!text.trim()) {
    return (
      <div className="surface-solid rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink">Guardrail scan</h2>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${style.chip}`}>
            Idle
          </span>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
          Checks your line against language that commonly suppresses organic reach or fails ad review. Runs
          locally, no API call.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-solid rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">Guardrail scan</h2>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${style.chip}`}>
          {style.label}
        </span>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">{report.headline}</p>

      <p
        className={`mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
          report.level === "clear" ? "text-good" : report.level === "adRisk" ? "text-mid" : "text-bad"
        }`}
        style={{ backgroundColor: `color-mix(in oklab, currentColor 10%, transparent)` }}
      >
        {report.detail}
      </p>

      {report.hits.length > 0 ? (
        <>
          <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-ink-muted">Flagged phrases</p>
          <div className="mt-2 flex flex-wrap gap-2 font-medium">
            {chars.map((char, index) => {
              const span = spans.find((candidate) => index >= candidate.start && index < candidate.end);
              if (!span) return null;

              const hit = report.hits.find(
                (candidate) =>
                  candidate.index === span.start && candidate.index + candidate.matched.length === span.end,
              );

              return (
                <span
                  key={index}
                  className={`rounded px-1 py-0.5 text-xs ${
                    hit?.rule.severity === "suppress"
                      ? "bg-bad/85 text-white"
                      : "bg-mid/85 text-neutral-900"
                  }`}
                >
                  {char}
                </span>
              );
            })}
          </div>

          <ul className="mt-4 space-y-3">
            {report.hits.map((hit) => (
              <li key={hit.rule.id} className="rounded-xl border border-white/8 p-3">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded text-[9px] font-bold ${
                      hit.rule.severity === "suppress"
                        ? "bg-bad/25 text-bad"
                        : "bg-mid/25 text-mid"
                    }`}
                  >
                    {hit.rule.severity === "suppress" ? "!" : "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">
                      {CATEGORY_LABELS[hit.rule.category]} - {hit.rule.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{hit.rule.note}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {suggestions.length > 0 ? (
            <div className="mt-4 border-t border-white/8 pt-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Rewrites that avoid the flag</p>
              <ul className="mt-2 space-y-2">
                {suggestions.map((rule) => (
                  <li key={rule.id} className="rounded-lg bg-white/4 p-3">
                    <p className="text-[11px] leading-relaxed text-zinc-300">{rule.suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      <p className="mt-4 border-t border-white/8 pt-3 text-[10px] leading-relaxed text-ink-muted/60">
        Static screening, not a compliance guarantee. Platforms do not publish rule sets and suppression is
        model-based, so this list will drift. Ruleset {report.version}.
      </p>

    </div>
  );
}
