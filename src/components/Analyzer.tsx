"use client";

import { useMemo, useState } from "react";
import { ScoreRing } from "@/components/ScoreRing";
import { StageLoader, type LoaderStage } from "@/components/StageLoader";
import { VideoAnalyzer } from "@/components/VideoAnalyzer";
import { ThumbnailStudio } from "@/components/ThumbnailStudio";
import { CompliancePanel } from "@/components/CompliancePanel";
import { AppSidebar } from "@/components/AppSidebar";
import { HelpModals } from "@/components/HelpModals";
import { ProGate } from "@/components/ProGate";
import { ScoutModal } from "@/components/ScoutModal";
import { useRouter } from "next/navigation";
import { PERSONAS } from "@/lib/engine/personas";
import { NICHE_LABELS, PRO_NICHES } from "@/lib/engine/config";
import { scoreHook } from "@/lib/engine/score";
import { languageLabel } from "@/lib/engine/personas";
import { HOOK_MAX_CHARS, type HookStrengthResult, type Niche, type Rewrite } from "@/lib/engine/types";

const EXAMPLES = [
  "Your first 3 seconds are wasted.",
  "Here's why your first video flopped.",
  "Stop buying bitcoin on the hype.",
  "The 3 things nobody tells you about making money online in 2026.",
];

const FREE_NICHES: Niche[] = ["general", "lifestyle", "comedy"];

const BAND_TEXT: Record<HookStrengthResult["band"], string> = {
  strong: "text-good",
  workable: "text-mid",
  weak: "text-bad",
};

const BAND_CHIP: Record<HookStrengthResult["band"], string> = {
  strong: "border-good/40 bg-good/10 text-good",
  workable: "border-mid/40 bg-mid/10 text-mid",
  weak: "border-bad/40 bg-bad/10 text-bad",
};

const REWRITE_STAGES: LoaderStage[] = [
  { id: "scoring", label: "Scoring your hook", detail: "Curiosity, readability, pace and structure." },
  { id: "rewriting", label: "Rewriting with Gemini", detail: "Three structural patterns, generated in one pass." },
  { id: "checking", label: "Checking length", detail: "Every rewrite has to fit your first 3 seconds." },
];

function PillarRow({ name, earned, max }: { name: string; earned: number; max: number }) {
  const ratio = max === 0 ? 0 : Math.min(1, earned / max);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="capitalize tracking-wide text-zinc-300">{name}</span>
        <span className="tabular-nums text-zinc-500">
          {earned}/{max}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-700"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

export function Analyzer({
  signedIn,
  plan,
  analysesUsed,
  monthlyLimit,
  videoTrialUsed,
  email,
  codesEnabled,
  priceNote,
}: {
  signedIn: boolean;
  plan: "free" | "pro";
  analysesUsed: number;
  monthlyLimit: number;
  videoTrialUsed: boolean;
  email: string | null;
  codesEnabled: boolean;
  priceNote: string;
}) {
  const [text, setText] = useState("");
  const [niche, setNiche] = useState<Niche>("general");
  const [result, setResult] = useState<HookStrengthResult | null>(null);
  const [rewrites, setRewrites] = useState<Rewrite[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaderStage, setLoaderStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [personaId, setPersonaId] = useState<string>("none");
  const [language, setLanguage] = useState<string>("none");

  const [modal, setModal] = useState<
  "persona" | "translate" | "rubric" | "thumbnail" | "scout" | "grade" | null
>(null);
  const [gate, setGate] = useState<{ feature: string; detail: string } | null>(null);

  const router = useRouter();
  const personaActive = personaId !== "none";
  const pro = plan === "pro";
  const remaining = HOOK_MAX_CHARS - text.length;
  const canAnalyze = text.trim().length >= 8;
  const quotaLeft = monthlyLimit - analysesUsed;

  const liveScore = useMemo(
    () => (text.trim() ? scoreHook(text, niche, personaActive ? personaId : null) : null),
    [text, niche, personaId, personaActive],
  );

  function reset() {
    setResult(null);
    setRewrites([]);
    setThumbnails([]);
    setError(null);
  }

  async function runAnalyze() {
    if (!canAnalyze || loading) return;
    setLoading(true);
    setError(null);
    setRewrites([]);
    setLoaderStage(0);

    const timer = setInterval(() => {
      setLoaderStage((current) => Math.min(REWRITE_STAGES.length - 2, current + 1));
    }, 900);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, niche, personaId, language }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Analysis failed (${response.status})`);
      }

      const body = (await response.json()) as {
        strength: HookStrengthResult;
        rewrites: Rewrite[];
        thumbnails?: string[];
      };
      setLoaderStage(REWRITE_STAGES.length - 1);
      setResult(body.strength);
      setRewrites(body.rewrites);
      setThumbnails(body.thumbnails ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      setResult(liveScore);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  const shown = result ?? liveScore;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_364px]">
      <section className="min-w-0 space-y-6">
        <div className="glass rounded-3xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="hook" className="text-sm font-medium text-zinc-200">
              Your opening line
            </label>
            <span
              className={`text-xs tabular-nums ${remaining < 0 ? "text-bad" : remaining < 40 ? "text-mid" : "text-zinc-500"}`}
            >
              {text.length}/{HOOK_MAX_CHARS}
            </span>
          </div>

          <textarea
            id="hook"
            value={text}
            onChange={(event) => {
              setText(event.target.value.slice(0, HOOK_MAX_CHARS));
              reset();
            }}
            rows={3}
            placeholder="Type the first line you say in your video"
            className="focus-ring w-full resize-none rounded-2xl border border-white/10 bg-white/4 px-4 py-3.5 text-lg leading-relaxed text-zinc-50 outline-none transition placeholder:text-zinc-600"
          />

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {FREE_NICHES.map((option) => (
              <NicheChip key={option} option={option} active={niche === option} onPick={() => { setNiche(option); reset(); }} />
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" />
            {PRO_NICHES.filter((option) => !FREE_NICHES.includes(option)).map((option) => (
              <NicheChip
                key={option}
                option={option}
                active={niche === option}
                locked={!pro}
                onPick={() => {
                  if (!pro) return;
                  setNiche(option);
                  reset();
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runAnalyze}
              disabled={!canAnalyze || loading}
              className="btn-primary px-6 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {loading ? "Rewriting..." : "Get 3 rewrites"}
            </button>

            {signedIn ? (
              <span className="text-xs text-zinc-500">
                {pro ? "Pro - unlimited" : `${quotaLeft} of ${monthlyLimit} left this month`}
              </span>
            ) : (
              <a href="/login" className="text-xs text-accent-2 underline-offset-4 hover:underline">
                Sign in to save your history
              </a>
            )}
          </div>

          {error ? <p className="mt-4 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p> : null}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-4">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setText(example);
                  reset();
                }}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-accent/40 hover:text-zinc-200"
              >
                {example.length > 32 ? `${example.slice(0, 32)}...` : example}
              </button>
            ))}
          </div>
        </div>

        <CompliancePanel text={text} />

<VideoAnalyzer
          onTranscript={(value) => {
            setText(value);
            reset();
          }}
          signedIn={signedIn}
          pro={pro}
          trialAvailable={!videoTrialUsed}
        />

        {rewrites.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {rewrites.map((rewrite, index) => {
              const rewriteScore = rewrite.text ? scoreHook(rewrite.text, niche).total : null;
              const delta =
                rewriteScore !== null && liveScore ? rewriteScore - liveScore.total : null;

              return (
                <article
                  key={rewrite.pattern}
                  className="surface-solid animate-fade-rise rounded-2xl p-5"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-2">
                      {rewrite.title}
                    </h3>
                    {rewriteScore !== null ? (
                      <span
                        className={`shrink-0 text-lg font-semibold tabular-nums ${
                          rewriteScore >= 80
                            ? "text-good"
                            : rewriteScore >= 55
                              ? "text-mid"
                              : "text-bad"
                        }`}
                        title="Hook Strength Score of this rewrite"
                      >
                        {rewriteScore}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-base leading-relaxed text-zinc-50">{rewrite.text}</p>
                  {rewrite.rationale ? (
                    <p className="mt-3 text-xs leading-relaxed text-zinc-500">{rewrite.rationale}</p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                    <span className="text-[11px] tabular-nums text-zinc-500">
                      {rewrite.text.length} chars - ~{(rewrite.text.length / 15).toFixed(1)}s spoken
                    </span>
                    {delta !== null && delta !== 0 ? (
                      <span
                        className={`text-[11px] font-medium tabular-nums ${
                          delta > 0 ? "text-good" : "text-bad"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta} vs yours
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <aside className="min-w-0 space-y-6 lg:sticky lg:top-20">
        <div className="glass rounded-3xl p-6">
          {shown ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <ScoreRing result={shown} />
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${BAND_CHIP[shown.band]}`}
                >
                  {shown.band}
                </span>
              </div>

              <p className={`text-center text-sm leading-relaxed ${BAND_TEXT[shown.band]}`}>{shown.verdict}</p>

              <div className="surface-solid space-y-3.5 rounded-2xl p-4">
                {(["curiosity", "readability", "speed", "structure"] as const).map((pillar) => (
                  <PillarRow
                    key={pillar}
                    name={pillar}
                    earned={shown.pillars[pillar].earned}
                    max={shown.pillars[pillar].max}
                  />
                ))}
              </div>

              {shown.advice.length > 0 ? (
                <div className="border-t border-white/8 pt-5">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">What to fix</p>
                  <ul className="space-y-2">
                    {shown.advice.map((line) => (
                      <li key={line} className="text-xs leading-relaxed text-zinc-300">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">
              Start typing and your score lands here instantly.
            </p>
          )}
        </div>

          {signedIn ? (
            <div className="surface-solid rounded-2xl p-4 text-xs leading-relaxed text-ink-muted">
              {pro
                ? "Pro. Unlimited text and video analyses."
                : `${quotaLeft} of ${monthlyLimit} free analyses left this month.`}
              {!pro && !videoTrialUsed ? (
                <p className="mt-2 text-accent-2">You also have one free video analysis waiting.</p>
              ) : null}
            </div>
          ) : null}

          {language !== "none" ? (
            <div className="surface-solid rounded-2xl p-4 text-xs leading-relaxed text-ink-muted">
              Rewrites will come back in <span className="text-ink">{languageLabel(language)}</span>, not
              English.
              {!pro ? (
                <button
                  type="button"
                  onClick={() => setModal("translate")}
                  className="mt-2 block text-accent-2 underline underline-offset-4"
                >
                  What does Pro unlock?
                </button>
              ) : null}
            </div>
          ) : null}
      </aside>

      {thumbnails.length > 0 ? (
        <div className="surface-solid rounded-3xl p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-ink">Thumbnail lab</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Three titles from your script, graded and tested against a real grid.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModal("thumbnail")}
                className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                What makes a cover title work?
              </button>
              <button
                type="button"
                onClick={() => setModal("grade")}
                className="text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                How is it graded?
              </button>
            </div>
          </div>

          <div className="mt-5">
            <ThumbnailStudio thumbnails={thumbnails} />
          </div>
        </div>
      ) : null}

      <ProGate
        open={Boolean(gate)}
        onClose={() => setGate(null)}
        feature={gate?.feature ?? "Creator Pro"}
        detail={gate?.detail ?? ""}
        priceNote={priceNote}
        email={email}
        signedIn={signedIn}
        plan={plan}
        codesEnabled={codesEnabled}
        onActivated={() => setGate(null)}
      />

      <HelpModals
        personaOpen={modal === "persona"}
        onClosePersona={() => setModal(null)}
        translateOpen={modal === "translate"}
        onCloseTranslate={() => setModal(null)}
        rubricOpen={modal === "rubric"}
        onCloseRubric={() => setModal(null)}
        thumbnailOpen={modal === "thumbnail"}
        onCloseThumbnail={() => setModal(null)}
        gradeOpen={modal === "grade"}
        onOpenGrade={() => setModal("grade")}
        onCloseGrade={() => setModal(null)}
        thumbnails={thumbnails}
        plan={plan}
      />

      <AppSidebar
        signedIn={signedIn}
        plan={plan}
        currentLanguage={language}
        currentPersona={personaId}
        onPickPersona={(id) => {
          const target = PERSONAS.find((p) => p.id === id);

          if (target?.tier === "pro" && !pro) {
            setGate({
              feature: `${target.label} is Pro`,
              detail: "Pro personas inject a rewrite instruction into the model so all three hooks come back pitched to that audience. Four personas are free.",
            });
            return;
          }

          setPersonaId(id);
          reset();
        }}
        onPickLanguage={(id) => {
          if (id !== "none" && !pro) {
            setGate({
              feature: "Localisation is Pro",
              detail: "Each language carries its own adaptation rules - compression limits, register, and the scripts that need special handling. Word-for-word translation is what kills a hook.",
            });
            return;
          }

          setLanguage(id);
          reset();
        }}
        onOpenPersona={() => setModal("persona")}
        onOpenTranslateHelp={() => setModal("translate")}
        onOpenThumbnailHelp={() => setModal("thumbnail")}
        onOpenScout={() => setModal("scout")}
        onOpenHistory={() => router.push("/account")}
      />

      <ScoutModal
        open={modal === "scout"}
        onClose={() => setModal(null)}
        pro={pro}
        onLocked={() => {
          setModal(null);
          setGate({
            feature: "Competitor scout is Pro",
            detail:
              "Paste a transcript of a video that already worked and the scout isolates the opening line, then scores it with the same rubric.",
          });
        }}
        onUseHook={(hook) => {
          setText(hook.slice(0, HOOK_MAX_CHARS));
          reset();
        }}
      />

      {loading ? (
        <StageLoader
          stages={REWRITE_STAGES}
          activeIndex={loaderStage}
          ratio={null}
          headline="Grading your hook"
        />
      ) : null}
    </div>
  );
}

function NicheChip({
  option,
  active,
  locked,
  onPick,
}: {
  option: Niche;
  active: boolean;
  locked?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={locked}
      title={locked ? "Creator Pro only" : undefined}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-accent/60 bg-accent/20 text-zinc-50"
          : locked
            ? "cursor-not-allowed border-white/5 text-zinc-600"
            : "border-white/10 text-zinc-400 hover:border-accent/40 hover:text-zinc-200"
      }`}
    >
      {NICHE_LABELS[option]}
      {locked ? " Â· Pro" : ""}
    </button>
  );
}
