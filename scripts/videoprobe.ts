import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const key = env.GEMINI_API_KEY;
const bytes = Buffer.from("not a real video");

async function main() {
  console.log("=== 1. POST upload/v1beta/files (resumable start) ===");
  const start = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.length),
      "X-Goog-Upload-Header-Content-Type": "video/mp4",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: "probe.mp4" } }),
  });

  const startBody = ((await start.text()) as string).replace(/\s+/g, " ").slice(0, 220);
  console.log("status:", start.status);
  console.log("body:", startBody);

  const uploadUrl = start.headers.get("x-goog-upload-url");
  console.log("x-goog-upload-url:", uploadUrl ? uploadUrl.slice(0, 90) : "(none)");

  if (!uploadUrl) return;

  console.log("\n=== 2. upload_id in session URL? ===");
  const parsed = new URL(uploadUrl);
  console.log("upload_id:", parsed.searchParams.get("upload_id") ?? "(none)");

  console.log("\n=== 3. PUT bytes to session URL ===");
  const finish = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": String(bytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Header-Content-Type": "video/mp4",
    },
    body: bytes,
  });
  const finishBody = ((await finish.text()) as string).replace(/\s+/g, " ").slice(0, 300);
  console.log("status:", finish.status);
  console.log("body:", finishBody);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});