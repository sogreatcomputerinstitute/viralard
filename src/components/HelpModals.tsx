"use client";

import { Modal } from "@/components/Modal";
import { PERSONAS, LANGUAGE_DIRECTIVES, LANGUAGES } from "@/lib/engine/personas";
import { PILLAR_MAX } from "@/lib/engine/config";
import { VIDEO_THEMES } from "@/lib/contrast";
import { THUMBNAIL_GENERATOR_RULES, THUMBNAIL_MAX_WORDS } from "@/lib/thumbnail";

export function HelpModals({
  personaOpen,
  onClosePersona,
  translateOpen,
  onCloseTranslate,
  rubricOpen,
  onCloseRubric,
  thumbnailOpen,
  onCloseThumbnail,
  gradeOpen,
  onOpenGrade,
  onCloseGrade,
  thumbnails,
  plan,
}: {
  personaOpen: boolean;
  onClosePersona: () => void;
  translateOpen: boolean;
  onCloseTranslate: () => void;
  rubricOpen: boolean;
  onCloseRubric: () => void;
  thumbnailOpen: boolean;
  onCloseThumbnail: () => void;
  gradeOpen: boolean;
  onOpenGrade: () => void;
  onCloseGrade: () => void;
  thumbnails: string[];
  plan: "free" | "pro";
}) {
  const pro = plan === "pro";

  return (
    <>
      <Modal open={personaOpen} onClose={onClosePersona} title="Audience personas">
        <p className="text-sm leading-relaxed text-ink-muted">
          A hook written for a 19-year-old gamer fails on a corporate channel, and vice versa. Picking a
          persona injects a rewrite instruction into the model so all three alternatives come back pitched to
          that audience instead of a generic viewer.
        </p>

        <div className="mt-5 space-y-2.5">
          {PERSONAS.map((persona) => {
            const locked = persona.tier === "pro" && !pro;
            return (
              <div
                key={persona.id}
                className={`surface-solid rounded-xl p-3.5 ${locked ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">{persona.label}</p>
                  {locked ? (
                    <span className="rounded-full border border-accent/50 bg-accent/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-accent-2">
                      Pro
                    </span>
                  ) : null}
                </div>
                {persona.prompt ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{persona.prompt}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-ink-muted">No persona applied.</p>
                )}
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal open={translateOpen} onClose={onCloseTranslate} title="Localisation" size="lg">
        <p className="text-sm leading-relaxed text-ink-muted">
          Word-for-word translation kills a hook. The words stay correct and the tension drains out, which is
          why a hook that works in English routinely flops when pasted through Google Translate. Every
          language below carries its own adaptation instruction - compression rules, register, and the scripts
          that need different handling.
        </p>

        <div className="surface-solid mt-5 rounded-xl p-4">
          <p className="text-xs font-medium text-ink">Why it costs a Pro seat</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            Localisation adds a second instruction block and a non-English output pass to every request. It is
            still a fraction of a cent, but it is not part of the free product, so it sits behind the plan
            rather than silently costing you money on every free analysis.
          </p>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {LANGUAGES.filter((language) => language.id !== "none").map((language) => (
            <div key={language.id} className="rounded-lg border border-white/8 p-3">
              <p className="text-xs font-medium text-ink">{language.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                {LANGUAGE_DIRECTIVES[language.id]?.split(".")[0] ?? "Standard adaptation."}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={rubricOpen} onClose={onCloseRubric} title="How the score works" size="lg">
        <p className="text-sm leading-relaxed text-ink-muted">
          Four metrics, 25 points each, computed in JavaScript. No model is involved in the score - only in the
          rewrites. The same input always produces the same number.
        </p>

        <div className="mt-5 space-y-4">
          <div className="surface-solid rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-ink">Speed &amp; Pacing</p>
              <p className="text-xs text-accent-2">{PILLAR_MAX.speed} pts</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Counts words, not characters. 5 to 11 words scores full marks because that is roughly three seconds
              of human speech. 12 to 15 loses points. Under 5 lacks context. Over 15 is flagged as too slow to
              land.
            </p>
          </div>

          <div className="surface-solid rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-ink">Readability</p>
              <p className="text-xs text-accent-2">{PILLAR_MAX.readability} pts</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Starts at full marks. Deducts 5 per word longer than 8 characters as a jargon proxy, and 10 if the
              line contains a semicolon or more than one comma, because multi-clause sentences break spoken
              rhythm.
            </p>
          </div>

          <div className="surface-solid rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-ink">Structure &amp; Triggers</p>
              <p className="text-xs text-accent-2">{PILLAR_MAX.structure} pts</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Checks whether the line opens with a recognised framework such as &ldquo;stop doing&rdquo; or
              &ldquo;the biggest mistake&rdquo;. Deducts 15 for a generic intro like &ldquo;hey guys&rdquo;. A
              short unhedged declarative opener earns partial credit even without a listed phrase.
            </p>
          </div>

          <div className="surface-solid rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-ink">Curiosity Gap</p>
              <p className="text-xs text-accent-2">{PILLAR_MAX.curiosity} pts</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Two or more signals - a secret token, an open loop, confrontational language, an absolute, a
              number, or second person - score full marks. One signal scores 15. Bare pointers like
              &ldquo;this&rdquo; never count on their own.
            </p>
          </div>
        </div>

        <div className="surface-solid mt-5 rounded-xl p-4">
          <p className="text-xs font-medium text-ink">What the score is not</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            It is not a prediction of video retention. We have no view of your analytics and no cohort data, so
            treat it as a structural checklist for the opening line.
          </p>
        </div>

        {thumbnails.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-medium text-ink">Thumbnail titles from your last run</p>
            <div className="mt-2 space-y-2">
              {thumbnails.map((thumbnail) => (
                <div key={thumbnail} className="surface-solid rounded-lg px-3 py-2.5 text-center">
                  <span className="text-base font-black uppercase tracking-tight text-ink">{thumbnail}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    <Modal
        open={thumbnailOpen}
        onClose={onCloseThumbnail}
        title="Thumbnail text"
        size="lg"
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          A great hook inside the video is wasted if nobody taps. These three titles are built for the cover
          image, not the video itself - under four words each, all caps, because that is the only size legible
          in a scrolling grid.
        </p>

        {thumbnails.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {thumbnails.map((thumbnail, index) => (
              <div
                key={thumbnail}
                className="rounded-xl border border-white/10 bg-gradient-to-br from-accent/25 to-accent-3/10 p-6 text-center"
              >
                <span className="text-lg font-black uppercase leading-tight tracking-tight text-ink">
                  {thumbnail}
                </span>
                <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Option {index + 1}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="surface-solid mt-5 rounded-xl p-5 text-center">
            <p className="text-sm text-ink-muted">
              Run an analysis and three thumbnail titles will appear here.
            </p>
          </div>
        )}

        <div className="surface-solid mt-5 rounded-xl p-4">
          <p className="text-xs font-medium text-ink">What makes a cover title work</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
            <li>Three words or fewer - the grid thumbnail is tiny</li>
            <li>Concrete, not clever. &ldquo;STOP BUYING HYPE&rdquo; beats &ldquo;YOU WONT BELIEVE THIS&rdquo;</li>
            <li>Never repeat your hook word for word, or the tap feels like a rerun</li>
            <li>Contrast lives in the image, so keep the text plain and heavy</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onOpenGrade}
          className="btn-ghost mt-5 w-full px-5 py-2.5 text-sm"
        >
          How are thumbnails graded?
        </button>
      </Modal>

      <Modal open={gradeOpen} onClose={onCloseGrade} title="Thumbnail grading" size="lg">
        <p className="text-sm leading-relaxed text-ink-muted">
          Three deterministic checks, no model involved. The generator writes the words; every judgement here is
          arithmetic, so the same title always scores the same.
        </p>

        <div className="mt-5 space-y-3">
          <div className="surface-solid rounded-xl p-4">
            <p className="text-xs font-medium text-ink">1. Length</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {THUMBNAIL_MAX_WORDS} words or fewer. Anything longer wraps, shrinks, and becomes unreadable in a
              grid. This is the check that fails most often.
            </p>
          </div>

          <div className="surface-solid rounded-xl p-4">
            <p className="text-xs font-medium text-ink">2. Contrast</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Scored against {VIDEO_THEMES.length} real video background themes - studio white, window daylight,
              beach sand, night street and the rest. White text with a drop shadow has to clear most of them,
              not just the flattering ones.
            </p>
          </div>

          <div className="surface-solid rounded-xl p-4">
            <p className="text-xs font-medium text-ink">3. Safe zone</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Longer copy renders smaller and reaches further down the frame. Past roughly 86% vertical it
              collides with the duration badge - the one overlay that is always present in a grid.
            </p>
          </div>
        </div>

        <div className="surface-solid mt-5 rounded-xl p-4">
          <p className="text-xs font-medium text-ink">Writing rules the generator follows</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
            {THUMBNAIL_GENERATOR_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}