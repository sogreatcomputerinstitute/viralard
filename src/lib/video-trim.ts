export const ANALYSIS_WINDOW_SECONDS = 5;

/**
 * Vercel functions reject request bodies over 4.5MB with a 413 and there is no
 * flag to raise it. A trimmed 5-second 720p clip lands around 1-3MB, so the
 * clip is cut and re-encoded in the browser and only that reaches the server.
 * The full-resolution original never leaves the device, which also means the
 * app stores nothing and costs no Supabase storage.
 */
export const MAX_ANALYSIS_BYTES = 4 * 1024 * 1024;

export const MAX_SOURCE_BYTES = 400 * 1024 * 1024;

const OUTPUT_WIDTH = 720;
const TARGET_FPS = 24;
const VIDEO_MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadeddata = () => resolve(video);
    video.onerror = () => {
      cleanup();
      reject(new Error("This browser could not read that video file."));
    };

    setTimeout(() => {
      if (video.readyState < 2) {
        cleanup();
        reject(new Error("Timed out reading the video."));
      }
    }, 20000);
  });
}

export type TrimResult = {
  blob: Blob;
  durationSeconds: number;
  sourceDurationSeconds: number;
};

export type TrimStage = "reading" | "cutting" | "encoding";

export type TrimProgress = {
  stage: TrimStage;
  /** 0 to 1 within the current stage, or null when indeterminate. */
  ratio: number | null;
};

type CapturableVideo = HTMLVideoElement & { captureStream?: () => MediaStream };

export async function trimForAnalysis(
  file: File,
  onProgress?: (progress: TrimProgress) => void,
): Promise<TrimResult> {
  onProgress?.({ stage: "reading", ratio: null });

  const video = (await loadVideo(file)) as CapturableVideo;

  const sourceDuration = Number.isFinite(video.duration) ? video.duration : 0;
  const duration = Math.min(ANALYSIS_WINDOW_SECONDS, sourceDuration || ANALYSIS_WINDOW_SECONDS);

  if (!("MediaRecorder" in window) || typeof video.captureStream !== "function") {
    throw new Error(
      "This browser cannot re-encode video in-page. Try Chrome or Edge, or paste your opening line instead.",
    );
  }

  const ratio = video.videoWidth && video.videoHeight ? video.videoHeight / video.videoWidth : 9 / 16;
  const width = Math.min(OUTPUT_WIDTH, video.videoWidth || OUTPUT_WIDTH);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round(width * ratio);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not open a 2D canvas context.");

  const stream = canvas.captureStream(TARGET_FPS);
  const mimeType = VIDEO_MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate));

  if (!mimeType) {
    throw new Error("This browser has no supported video encoder.");
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_400_000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const startedAt = performance.now();
  let raf = 0;

  const draw = () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const elapsed = (performance.now() - startedAt) / 1000;
    onProgress?.({ stage: "cutting", ratio: Math.min(1, elapsed / duration) });

    if (elapsed >= duration) {
      cancelAnimationFrame(raf);
      if (recorder.state !== "inactive") recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    raf = requestAnimationFrame(draw);
  };

  onProgress?.({ stage: "cutting", ratio: 0 });
  raf = requestAnimationFrame(draw);
  await video.play().catch(() => undefined);
  await stopped;

  onProgress?.({ stage: "encoding", ratio: null });

  const blob = new Blob(chunks, { type: mimeType });

  if (blob.size === 0) {
    throw new Error("The trimmed clip came out empty. Try a different video.");
  }

  onProgress?.({ stage: "encoding", ratio: 1 });

  return {
    blob,
    durationSeconds: duration,
    sourceDurationSeconds: Math.round(sourceDuration),
  };
}

export function trimFileName(sourceName: string): string {
  const base = sourceName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${base}-first${ANALYSIS_WINDOW_SECONDS}s.webm`;
}