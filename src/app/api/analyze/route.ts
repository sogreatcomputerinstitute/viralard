import { NextResponse } from "next/server";
import { cacheKey, generateRewritesAndThumbnails } from "@/lib/engine/analyze";
import { DEFAULT_MODEL, isGeminiConfigured } from "@/lib/ai/gemini";
import { scoreHook, analyzeNiche } from "@/lib/engine/score";
import { HOOK_MAX_CHARS, isNiche, type AnalyzeResponse } from "@/lib/engine/types";
import { findPersona, languageLabel } from "@/lib/engine/personas";
import { createClient } from "@/lib/supabase/server";
import { FREE_MONTHLY_LIMIT, PRO_FAIR_USE_LIMIT } from "@/lib/limits";

export const runtime = "nodejs";

const memoryCache = new Map<string, AnalyzeResponse & { thumbnails: string[] }>();

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

type Quota = {
  userId: string;
  plan: "free" | "pro";
  credits: number;
  used: number;
};

async function loadQuota(userId: string): Promise<Quota> {
  const supabase = await createClient();

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase.from("profiles").select("plan, credits").eq("id", userId).maybeSingle(),
    supabase
      .from("usage_monthly")
      .select("count")
      .eq("user_id", userId)
      .eq("month", monthStart())
      .maybeSingle(),
  ]);

  return {
    userId,
    plan: profile?.plan === "pro" ? "pro" : "free",
    credits: profile?.credits ?? 0,
    used: usage?.count ?? 0,
  };
}

async function spendCredit(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .maybeSingle();

  const remaining = profile?.credits ?? 0;
  if (remaining <= 0) return 0;

  await supabase.from("profiles").update({ credits: remaining - 1 }).eq("id", userId);
  return remaining - 1;
}

async function persist(
  quota: Quota,
  cacheHit: boolean,
  niche: string,
  personaId: string | null,
  language: string,
  strength: ReturnType<typeof scoreHook>,
  rewrites: AnalyzeResponse["rewrites"],
  thumbnails: string[],
): Promise<void> {
  const supabase = await createClient();

  if (!cacheHit) {
    /*
     * Must be the SQL increment function, not an INSERT. A plain insert threw
     * a duplicate-key error from the second analysis of a month onwards, so the
     * free counter sat at 1 forever and nobody was ever gated.
     */
    const { error } = await supabase.rpc("increment_usage", { p_month: monthStart() });
    if (error) console.error("usage increment failed", error.message);
  }

  const { data: hook, error: hookError } = await supabase
    .from("hooks")
    .insert({
      user_id: quota.userId,
      text: strength.text,
      niche,
      persona_id: personaId,
      language,
      total: strength.total,
      band: strength.band,
      pillars: strength.pillars,
      signals: strength.signals,
      advice: strength.advice,
      thumbnails,
    })
    .select("id")
    .single();

  if (hookError || !hook) {
    if (hookError) console.error("hook insert failed", hookError.message);
    return;
  }

  await supabase.from("rewrites").insert(
    rewrites
      .filter((rewrite) => rewrite.text)
      .map((rewrite) => ({
        hook_id: hook.id,
        user_id: quota.userId,
        pattern: rewrite.pattern,
        title: rewrite.title,
        text: rewrite.text,
        rationale: rewrite.rationale,
      })),
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = (body ?? {}) as {
    text?: unknown;
    niche?: unknown;
    personaId?: unknown;
    language?: unknown;
  };

  const text = typeof payload.text === "string" ? payload.text.trim() : "";

  if (text.length < 8) {
    return NextResponse.json({ error: "Write at least 8 characters." }, { status: 400 });
  }

  if (text.length > HOOK_MAX_CHARS) {
    return NextResponse.json(
      { error: `Hooks are capped at ${HOOK_MAX_CHARS} characters.` },
      { status: 400 },
    );
  }

  const niche = isNiche(payload.niche) ? payload.niche : analyzeNiche(payload.niche);
  const personaId = typeof payload.personaId === "string" ? payload.personaId : null;
  const language = typeof payload.language === "string" ? payload.language : "none";

  const requestedPersona = findPersona(personaId);
  let effectivePersonaId = personaId;
  let effectiveLanguage = language;

  let quota: Quota | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      quota = await loadQuota(data.user.id);

      if (requestedPersona?.tier === "pro" && quota.plan !== "pro") {
        return NextResponse.json(
          { error: "That persona is Creator Pro only.", code: "upgrade_required" },
          { status: 402 },
        );
      }

      if (language !== "none" && quota.plan !== "pro") {
        return NextResponse.json(
          {
            error: `Localisation is Creator Pro only. Upgrade to translate into ${languageLabel(language)}.`,
            code: "upgrade_required",
          },
          { status: 402 },
        );
      }

      const limit = quota.plan === "pro" ? PRO_FAIR_USE_LIMIT : FREE_MONTHLY_LIMIT;

      if (quota.used >= limit && quota.credits <= 0) {
        return NextResponse.json(
          {
            error:
              quota.plan === "pro"
                ? "You have hit the fair-use ceiling for this month."
                : `You have used all ${FREE_MONTHLY_LIMIT} free analyses this month.`,
            code: "quota_exceeded",
          },
          { status: 402 },
        );
      }

      if (quota.plan !== "pro" && quota.used >= limit) {
        quota.credits = await spendCredit(quota.userId);
      }
    } else {
      /*
       * Anonymous callers previously skipped the Pro checks entirely, which
       * meant Pro personas and every language were free without an account.
       * Silently downgrade instead of erroring - the free product should keep
       * working for someone who has not signed up yet.
       */
      if (requestedPersona?.tier === "pro") effectivePersonaId = "none";
      if (effectiveLanguage !== "none") effectiveLanguage = "none";
    }
  } catch {
    quota = null;
    if (requestedPersona?.tier === "pro") effectivePersonaId = "none";
    if (effectiveLanguage !== "none") effectiveLanguage = "none";
  }

  const key = cacheKey(text, niche, effectivePersonaId ?? "none", effectiveLanguage);
  const cached = memoryCache.get(key);
  const strength = scoreHook(text, niche);

  if (cached) {
    if (quota) {
      await persist(
        quota,
        true,
        niche,
        effectivePersonaId,
        effectiveLanguage,
        strength,
        cached.rewrites,
        cached.thumbnails,
      );
    }
    return NextResponse.json({ ...cached, cached: true });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const { rewrites, thumbnails } = await generateRewritesAndThumbnails(
      strength.text,
      niche,
      effectivePersonaId,
      effectiveLanguage,
    );

    const response: AnalyzeResponse & { thumbnails: string[] } = {
      strength,
      rewrites,
      cached: false,
      model: DEFAULT_MODEL,
      thumbnails,
    };

    memoryCache.set(key, response);

    if (quota) {
      await persist(
        quota,
        false,
        niche,
        effectivePersonaId,
        effectiveLanguage,
        strength,
        rewrites,
        thumbnails,
      );
    }

    return NextResponse.json({
      ...response,
      downgraded: (personaId !== effectivePersonaId || language !== effectiveLanguage) || undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rewrite generation failed." },
      { status: 502 },
    );
  }
}