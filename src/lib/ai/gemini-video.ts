import { DEFAULT_MODEL, MODEL_FALLBACKS } from "./gemini";

const UPLOAD_HOST = "https://generativelanguage.googleapis.com/upload/v1beta/files";
const API_HOST = "https://generativelanguage.googleapis.com/v1beta";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;

export type UploadedFile = {
  name: string;
  uri: string;
  mimeType: string;
};

function apiKey(): string | null {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_STUDIO_KEY ?? null;
}

async function startResumableUpload(file: File, key: string): Promise<string> {
  const response = await fetch(`${UPLOAD_HOST}?key=${key}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(file.size),
      "X-Goog-Upload-Header-Content-Type": file.type || "video/mp4",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: file.name || "upload" } }),
  });

  if (!response.ok) {
    throw new Error(`Upload session failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
  }

  const location = response.headers.get("x-goog-upload-url");
  if (!location) throw new Error("No resumable upload URL returned");

  return location;
}

type FileMetadata = { file?: { name?: string; uri?: string; mimeType?: string } };

/**
 * The finalize response is the only place the real file name appears. The
 * session URL carries an `upload_id`, which is NOT the file name - polling
 * `.../v1beta/<upload_id>` returns 404. Use file.name from the body.
 */
async function uploadBytes(url: string, bytes: ArrayBuffer, mimeType: string): Promise<FileMetadata> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Header-Content-Type": mimeType,
    },
    body: bytes,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
  }

  return (await response.json()) as FileMetadata;
}

async function waitForActive(name: string, key: string): Promise<UploadedFile> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await fetch(`${API_HOST}/${name}?key=${key}`);
    if (!response.ok) throw new Error(`File status failed (${response.status})`);

    const file = (await response.json()) as {
      state?: string;
      error?: { message?: string };
      uri?: string;
      mimeType?: string;
      name: string;
    };

    if (file.state === "ACTIVE" && file.uri) {
      return { name: file.name, uri: file.uri, mimeType: file.mimeType ?? "video/mp4" };
    }

    if (file.state === "FAILED") {
      throw new Error(file.error?.message ?? "Gemini could not process the video.");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for the video to become processable.");
}

export async function uploadVideo(file: File): Promise<UploadedFile> {
  const key = apiKey();
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const url = await startResumableUpload(file, key);
  const bytes = await file.arrayBuffer();
  const metadata = await uploadBytes(url, bytes, file.type || "video/mp4");

  const name = metadata.file?.name;
  if (!name) throw new Error("Gemini did not return a file name after upload.");

  return waitForActive(name, key);
}

export type VideoInsight = {
  spoken_hook: string;
  on_screen_text: string;
  first_frame_description: string;
  notes: string;
};

const VIDEO_PROMPT = [
  "You are analysing the first 3 seconds of a short-form vertical video (TikTok, Reels, Shorts).",
  "",
  "Return JSON only with exactly these keys:",
  '- "spoken_hook": the exact words a viewer hears in the first 3 seconds, transcribed verbatim. If there is no speech, return an empty string.',
  '- "on_screen_text": every piece of text visible in the first 3 seconds, verbatim, newline separated. Empty string if none.',
  '- "first_frame_description": one short sentence describing what is on screen at 0 seconds.',
  '- "notes": one short sentence on anything that would distract a viewer in the first second.',
  "",
  "Do not rewrite or improve the spoken hook. Transcribe exactly what is said.",
].join("\n");

export async function analyzeVideo(
  file: UploadedFile,
  model: string = DEFAULT_MODEL,
): Promise<VideoInsight> {
  const key = apiKey();
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const chain = [model, ...MODEL_FALLBACKS.filter((m) => m !== model)];
  const failures: string[] = [];

  for (const candidate of chain) {
    try {
      const response = await fetch(`${API_HOST}/models/${candidate}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: VIDEO_PROMPT },
                { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
            mediaResolution: "MEDIA_RESOLUTION_LOW",
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        failures.push(`${candidate} (${response.status}): ${detail.slice(0, 160)}`);
        continue;
      }

      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) {
        failures.push(`${candidate}: empty response`);
        continue;
      }

      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const body = fenced ? fenced[1] : text;
      return JSON.parse(body) as VideoInsight;
    } catch (error) {
      failures.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Video analysis failed on every model:\n${failures.join("\n")}`);
}

export async function deleteVideoFile(file: UploadedFile): Promise<void> {
  const key = apiKey();
  if (!key) return;

  await fetch(`${API_HOST}/${file.name}?key=${key}`, { method: "DELETE" }).catch(() => undefined);
}