"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StageLoader, type LoaderStage } from "@/components/StageLoader";
import { VideoPhonePreview } from "@/components/VideoPhonePreview";
import type { HookStrengthResult } from "@/lib/engine/types";
import {
  ANALYSIS_WINDOW_SECONDS,
  MAX_ANALYSIS_BYTES,
  MAX_SOURCE_BYTES,
  formatBytes,
  trimFileName,
  trimForAnalysis,
  type TrimProgress,
} from "@/lib/video-trim";

type VideoInsight = {
  spoken_hook: string;
  on_screen_text: string;
  first_frame_description: string;
  notes: string;
};

const STAGES: LoaderStage[] = [
  { id: "reading", label: "Reading your video", detail: "Decoding the file in your browser." },
  { id: "cutting", label: `Cutting to the first ${ANALYSIS_WINDOW_SECONDS} seconds`, detail: "Re-encoding to 720p so it fits the transfer limit." },
  { id: "encoding", label: "Compressing", detail: "Building the clip we will send for analysis." },
  { id: "uploading", label: "Uploading to Gemini", detail: "Only the trimmed clip leaves your device." },
  { id: "analysing", label: "Reading your first 3 seconds", detail: "Transcribing your spoken hook and on-screen text." },
];

type State =
  | { phase: "idle" }
  | { phase: "working"; stageIndex: number; ratio: number | null; previewUrl: string | null }
  | { phase: "done"; insight: VideoInsight; strength: HookStrengthResult | null; source: string | null; previewUrl: string; trimmedBytes: number }
  | { phase: "error"; message: string };

const STAGE_INDEX: Record<TrimProgress["stage"], number> = { reading: 0, cutting: 1, encoding: 2 };

export function VideoAnalyzer({
  onTranscript,
  signedIn,
  pro,
  trialAvailable,
}: {
  onTranscript: (text: string) => void;
  signedIn: boolean;
  pro: boolean;
  trialAvailable: boolean;
}) {
  const canAnalyze = signedIn && (pro || trialAvailable);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function releasePreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }

  async function run(file: File) {
    if (file.size > MAX_SOURCE_BYTES) {
      setState({ phase: "error", message: "That file is too large. Try a shorter clip." });
      return;
    }

    const sourceUrl = URL.createObjectURL(file);

    try {
      setState({ phase: "working", stageIndex: 0, ratio: null, previewUrl: sourceUrl });

      const trimmed = await trimForAnalysis(file, (progress) => {
        setState((current) =>
          current.phase === "working"
            ? { ...current, stageIndex: STAGE_INDEX[progress.stage], ratio: progress.ratio }
            : current,
        );
      });

      if (trimmed.blob.size > MAX_ANALYSIS_BYTES) {
        setState({
          phase: "error",
          message: `The trimmed clip is ${formatBytes(trimmed.blob.size)}, over the ${formatBytes(MAX_ANALYSIS_BYTES)} transfer limit. Paste your opening line instead.`,
        });
        return;
      }

      setState({ phase: "working", stageIndex: 3, ratio: null, previewUrl: sourceUrl });

      const form = new FormData();
      form.append("video", trimmed.blob, trimFileName(file.name));

      const response = await fetch("/api/video-analyze", { method: "POST", body: form });

      setState({ phase: "working", stageIndex: 4, ratio: null, previewUrl: sourceUrl });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; insight?: VideoInsight; strength?: HookStrengthResult | null; scoredSource?: string | null }
        | null;

      if (!response.ok || !body?.insight) {
        throw new Error(body?.error ?? `Analysis failed (${response.status})`);
      }

      const transcript = body.insight.spoken_hook?.trim() || body.insight.on_screen_text?.trim() || "";
      if (transcript) onTranscript(transcript.slice(0, 250));

      releasePreview();
      const previewUrl = URL.createObjectURL(file);
      previewRef.current = previewUrl;
      URL.revokeObjectURL(sourceUrl);

      setState({
        phase: "done",
        insight: body.insight,
        strength: body.strength ?? null,
        source: body.scoredSource ?? null,
        previewUrl,
        trimmedBytes: trimmed.blob.size,
      });
    } catch (error) {
      URL.revokeObjectURL(sourceUrl);
      setState({ phase: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  const busy = state.phase === "working";

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file && !busy) void run(file);
        }}
        className={`glass relative overflow-hidden rounded-3xl p-6 transition ${
          dragging ? "ring-2 ring-accent/60" : ""
        } ${!canAnalyze ? "opacity-70" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="sr-only"
          disabled={busy || !canAnalyze}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void run(file);
          }}
        />

        {state.phase === "done" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <video
                src={state.previewUrl}
                controls
                muted
                playsInline
                className="w-40 shrink-0 rounded-xl border border-white/10"
              />
              <div className="min-w-0 flex-1 space-y-3">
                {state.strength ? (
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-semibold tabular-nums text-accent-2">
                      {state.strength.total}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Scored from {state.source === "speech" ? "spoken audio" : "on-screen text"}
                      </p>
                      <p className="text-xs capitalize text-zinc-500">
                        {state.strength.band} hook - {state.strength.verdict.split(".")[0]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-mid">No speech detected in the first {ANALYSIS_WINDOW_SECONDS} seconds.</p>
                )}

                <dl className="space-y-1.5 text-xs">
                  <div>
                    <dt className="inline text-zinc-500">Spoken: </dt>
                    <dd className="inline text-zinc-300">{state.insight.spoken_hook || "none"}</dd>
                  </div>
                  <div>
                    <dt className="inline text-zinc-500">On screen: </dt>
                    <dd className="inline text-zinc-300">{state.insight.on_screen_text || "none"}</dd>
                  </div>
                  <div>
                    <dt className="inline text-zinc-500">First frame: </dt>
                    <dd className="inline text-zinc-300">{state.insight.first_frame_description}</dd>
                  </div>
                </dl>

                <p className="text-[11px] text-zinc-600">
                  Sent {formatBytes(state.trimmedBytes)} - the first {ANALYSIS_WINDOW_SECONDS}s only. Your full
                  video stayed on your device.
                </p>
              </div>
            </div>

            <div className="surface-solid rounded-2xl p-4">
              <VideoPhonePreview
                videoUrl={state.previewUrl}
                onScreenText={state.insight.on_screen_text}
                transcript={state.insight.spoken_hook}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                releasePreview();
                setState({ phase: "idle" });
              }}
              className="btn-ghost px-4 py-2 text-xs"
            >
              Analyse another
            </button>
          </div>
        ) : busy ? null : (
          <div className="space-y-2 py-2 text-center">
            <p className="text-sm font-medium text-zinc-100">
              {!signedIn
                ? "Sign in to analyse your video"
                : !canAnalyze
                  ? "Free video analysis used"
                  : trialAvailable && !pro
                    ? "One free video analysis"
                    : "Drop a draft video"}
            </p>

            {trialAvailable && signedIn && !pro ? (
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-accent-2">
                Try it once, free. We cut the first {ANALYSIS_WINDOW_SECONDS} seconds in your browser,
                transcribe what you actually said and score it. Nothing is stored.
              </p>
            ) : (
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-500">
                {!canAnalyze
                  ? "Creator Pro includes unlimited video analysis. Text scoring stays free."
                  : `We cut the first ${ANALYSIS_WINDOW_SECONDS} seconds in your browser and score what you actually said. Nothing is stored.`}
              </p>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!canAnalyze}
              className="btn-primary mt-3 px-5 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              {!signedIn
                ? "Sign in first"
                : trialAvailable && !pro
                  ? "Use my free analysis"
                  : !pro
                    ? "Upgrade to Pro"
                    : "Choose video"}
            </button>

            {!signedIn ? null : !pro && !trialAvailable ? (
              <Link href="/#pricing" className="mt-3 block text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">
                See what Pro includes
              </Link>
            ) : null}
          </div>
        )}
      </div>

      {state.phase === "error" ? (
        <p className="mt-2 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad">
          {state.message}
        </p>
      ) : null}

      {state.phase === "working" ? (
        <StageLoader
          stages={STAGES}
          activeIndex={state.stageIndex}
          ratio={state.ratio}
          headline="Reading your opening"
          previewUrl={state.previewUrl}
        />
      ) : null}
    </div>
  );
}