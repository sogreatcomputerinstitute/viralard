/**
 * Competitor hook scouting.
 *
 * IMPORTANT LEGAL NOTE, deliberately not hidden:
 *
 * Scraping YouTube's caption tracks violates the YouTube Terms of Service.
 * The widely-used `youtube-transcript-api` and its ports are built on private
 * endpoint behaviour. It works, it is everywhere, and it is not authorised.
 * That is a different risk class from parsing a blog post, and it is on us if
 * we ship it.
 *
 * The permitted route is the official YouTube Data API v3, which requires the
 * user to bring their own OAuth credentials and a quota-enabled project. That
 * is the integration this module is shaped around.
 *
 * Until those credentials exist, the scout accepts a pasted transcript. That
 * is the honest, shippable v1: the scoring and hook-extraction logic - the part
 * that is actually valuable and entirely ours - works identically either way,
 * and swapping in the API later is a fetch change.
 */

export type ScoutSource = "transcript" | "youtube_api";

export type ScoutResult = {
  transcript: string;
  hookText: string;
  charCount: number;
};

export function extractHook(transcript: string): string {
  const cleaned = transcript.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  /*
   * Captions carry no sentence casing or punctuation in many auto-generated
   * tracks, so a naive first-sentence split produces fragments. Cut at the
   * first strong terminator and fall back to a word budget that fits a
   * three-second read.
   */
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;

  if (firstSentence.length <= 250 && firstSentence.split(/\s+/).length >= 4) {
    return firstSentence.slice(0, 250);
  }

  const words = firstSentence.split(/\s+/).slice(0, 18).join(" ");
  return words.slice(0, 250);
}

export function isYouTubeUrl(value: string): boolean {
  return /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?|shorts\/|live\/)|youtu\.be\/)/i.test(value.trim());
}

export function extractVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (!isYouTubeUrl(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    if (url.hostname.replace(/^www\./, "").toLowerCase() === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;

    const shortMatch = url.pathname.match(/^\/(?:shorts|live|embed)\/([^/?]+)/);
    return shortMatch ? shortMatch[1] : null;
  } catch {
    return null;
  }
}

export type CaptionFetch =
  | { ok: true; transcript: string }
  | { ok: false; error: string };

/**
 * Placeholder for the official Data API path. Intentionally not implemented with
 * an unofficial scraper - see the legal note at the top of this file. Wire this
 * to `captions.list` + `captions.download` using the user's own OAuth token.
 */
export async function fetchCaptionsViaApi(videoId: string, accessToken: string): Promise<CaptionFetch> {
  if (!videoId || !accessToken) {
    return {
      ok: false,
      error:
        "YouTube Data API is not connected yet. Paste the transcript directly for now - the scoring works the same.",
    };
  }

  return {
    ok: false,
    error:
      "YouTube Data API is not connected yet. Paste the transcript directly for now - the scoring works the same.",
  };
}