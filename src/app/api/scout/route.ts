import { NextResponse } from "next/server";
import { extractHook, extractVideoId, isYouTubeUrl } from "@/lib/scout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = (body ?? {}) as { url?: unknown; transcript?: unknown };
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : "";

  if (transcript) {
    const hookText = extractHook(transcript);
    if (hookText.length < 8) {
      return NextResponse.json(
        { error: "Could not find an opening line in that transcript." },
        { status: 400 },
      );
    }
    return NextResponse.json({ hookText, transcript: transcript.slice(0, 5000), source: "transcript" });
  }

  if (!url) {
    return NextResponse.json({ error: "Paste a link or a transcript." }, { status: 400 });
  }

  if (!isYouTubeUrl(url)) {
    return NextResponse.json(
      { error: "Only YouTube links are supported. TikTok does not expose a public caption endpoint." },
      { status: 400 },
    );
  }

  const videoId = extractVideoId(url);

  if (!videoId) {
    return NextResponse.json({ error: "Could not read a video id from that link." }, { status: 400 });
  }

  return NextResponse.json(
    {
      error:
        "Automatic caption fetching needs the official YouTube Data API, which is not connected yet. Paste the transcript text below instead.",
      videoId,
      needsApi: true,
    },
    { status: 501 },
  );
}