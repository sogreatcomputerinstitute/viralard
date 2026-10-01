const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Preferred first, cheapest fallbacks last. Google retires 2.x models for new
 * projects, so an old hardcoded name returns 404 rather than degrading quietly.
 * Transient 503s are retried against the next entry.
 */
export const MODEL_FALLBACKS = [
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

const DEFAULT_MODEL = MODEL_FALLBACKS[0];

export type GeminiRewritePayload = {
  pattern_title: string;
  pattern_instruction: string;
  text: string;
  rationale: string;
};

export type GeminiResult = {
  model: string;
  rewrites: GeminiRewritePayload[];
};

function apiKey(): string | null {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_STUDIO_KEY ?? null;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(body.slice(start, end + 1));
}

export function isGeminiConfigured(): boolean {
  return apiKey() !== null;
}

export type GenerateOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

async function callModel(model: string, prompt: string, options: GenerateOptions, key: string) {
  const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.85,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw Object.assign(new Error(`Gemini ${model} failed (${response.status}): ${detail.slice(0, 300)}`), {
      status: response.status,
    });
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw Object.assign(new Error(`Gemini ${model} returned an empty response`), { status: 502 });

  return extractJson(text);
}

export async function generateStructured<T>(prompt: string, options: GenerateOptions = {}): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  const chain = options.model ? [options.model] : [...MODEL_FALLBACKS];
  const failures: string[] = [];

  for (const model of chain) {
    try {
      return (await callModel(model, prompt, options, key)) as T;
    } catch (error) {
      const status = (error as { status?: number }).status;
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);

      const recoverable = status === undefined || RETRYABLE_STATUS.has(status);
      if (!recoverable) throw error;
    }
  }

  throw new Error(`All Gemini models failed:\n${failures.join("\n")}`);
}

export { DEFAULT_MODEL };