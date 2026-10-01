"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { extractVideoId, isYouTubeUrl } from "@/lib/scout";

export function ScoutModal({
  open,
  onClose,
  pro,
  onUseHook,
  onLocked,
}: {
  open: boolean;
  onClose: () => void;
  pro: boolean;
  onUseHook: (hook: string) => void;
  onLocked: () => void;
}) {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);

  const linkLooksValid = url.trim().length > 0 && isYouTubeUrl(url);
  const videoId = linkLooksValid ? extractVideoId(url) : null;

  function reset() {
    setUrl("");
    setTranscript("");
    setStatus("idle");
    setMessage(null);
    setFound(null);
  }

  async function submit() {
    if (!pro) {
      onLocked();
      return;
    }

    setStatus("working");
    setMessage(null);

    const response = await fetch("/api/scout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() || undefined, transcript: transcript.trim() || undefined }),
    });

    const body = (await response.json().catch(() => null)) as {
      error?: string;
      hookText?: string;
      needsApi?: boolean;
    } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(body?.error ?? `Scout failed (${response.status})`);
      return;
    }

    setStatus("idle");
    setFound(body?.hookText ?? null);
  }

  return (
    <Modal open={open} onClose={onClose} title="Competitor scout" size="lg">
      <p className="text-sm leading-relaxed text-ink-muted">
        Paste a transcript of a video that already worked. The scout isolates the opening line and scores it
        with the same rubric, so you can see exactly why it held.
      </p>

      {!pro ? (
        <div className="mt-5 space-y-4">
          <div className="surface-solid rounded-xl p-4">
            <p className="text-xs font-medium text-ink">Scout is a Creator Pro feature</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Reverse-engineering competitors is the highest-rated thing creators want from this tool, so it
              sits on the paid plan rather than in the free tier.
            </p>
          </div>
          <button type="button" onClick={onLocked} className="btn-primary w-full px-5 py-2.5 text-sm">
            Unlock scout with Pro
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="scout-url" className="text-xs text-ink-muted">
              YouTube link (optional)
            </label>
            <input
              id="scout-url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setMessage(null);
              }}
              placeholder="https://youtube.com/shorts/..."
              className="focus-ring mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none"
            />

            {linkLooksValid ? (
              videoId ? (
                <p className="mt-2 text-[11px] text-good">Video id {videoId} recognised.</p>
              ) : (
                <p className="mt-2 text-[11px] text-mid">
                  Could not read a video id from that link. Check the format.
                </p>
              )
            ) : null}

            {url.trim() && !linkLooksValid ? (
              <p className="mt-2 text-[11px] leading-relaxed text-mid">
                Only YouTube links work. TikTok removed its embeddable player and exposes no caption endpoint,
                so there is nothing to fetch.
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="scout-transcript" className="text-xs text-ink-muted">
              Transcript text
            </label>
            <textarea
              id="scout-transcript"
              value={transcript}
              onChange={(event) => {
                setTranscript(event.target.value);
                setMessage(null);
              }}
              rows={5}
              placeholder="Paste the captions here. Auto-generated captions work fine."
              className="focus-ring mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none"
            />
          </div>

          <div className="surface-solid rounded-xl p-4">
            <p className="text-xs font-medium text-ink">About automatic fetching</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Reading captions straight off YouTube violates their terms of service, so we do not do it. The
              supported route is the official YouTube Data API with your own OAuth app, which is not connected
              yet. Paste the transcript and everything else works identically.
            </p>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={status === "working" || (!url.trim() && !transcript.trim())}
            className="btn-primary w-full px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "working" ? "Reading..." : "Extract the hook"}
          </button>

          {message ? (
            <p className={`text-xs leading-relaxed ${status === "error" ? "text-bad" : "text-mid"}`}>
              {message}
            </p>
          ) : null}

          {found ? (
            <div className="surface-solid rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Hook isolated</p>
              <p className="mt-2 text-base leading-relaxed text-ink">{found}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUseHook(found);
                    reset();
                    onClose();
                  }}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  Load into analyzer
                </button>
                <button type="button" onClick={reset} className="btn-ghost px-4 py-2 text-xs">
                  Clear
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}