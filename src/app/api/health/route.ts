import { NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports whether required configuration is present. Deliberately returns
 * booleans only - never a value, never a prefix of a key. This endpoint is
 * public, so anything more specific than a yes/no would be a leak.
 */
export async function GET() {
  const checks = {
    gemini: isGeminiConfigured(),
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    activationCodes: Boolean(process.env.PRO_ACTIVATION_CODES),
    cronSecret: Boolean(process.env.CRON_SECRET),
    monetag: process.env.MONETAG_ENABLED === "true",
    adSponsor: Boolean(process.env.AD_SPONSOR_HREF),
  };

  const required: (keyof typeof checks)[] = ["gemini", "supabaseUrl", "supabaseAnon", "serviceRole"];
  const missing = required.filter((key) => !checks[key]);

  return NextResponse.json(
    {
      ok: missing.length === 0,
      missing,
      checks,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      time: new Date().toISOString(),
    },
    { status: missing.length === 0 ? 200 : 503 },
  );
}