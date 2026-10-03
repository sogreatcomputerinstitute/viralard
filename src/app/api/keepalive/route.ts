import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase free-tier projects are suspended after roughly a week without
 * activity. Every query in the app is user-driven, so a quiet week means every
 * page starts 500ing for returning users with no local cause. This runs on a
 * daily Vercel cron and touches the tables the app actually depends on.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set, so
 * the route is not a free query endpoint for anyone who finds the URL.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set. Set it in the Vercel project to enable this route." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase env vars are missing." }, { status: 503 });
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const started = Date.now();

  /*
   * Three cheap reads across the tables the app reads. Purpose is activity
   * rather than data, so a head request with limit=1 is enough and costs
   * nothing meaningful against the free quota.
   */
  const checks: { table: string; ms: number; status: string; count?: number }[] = [];

  for (const table of ["profiles", "hooks", "usage_monthly"]) {
    const began = Date.now();

    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
      const body = (await response.text()) as string;

      checks.push({
        table,
        ms: Date.now() - began,
        status: response.ok ? "ok" : `http_${response.status}`,
        count: response.ok ? (JSON.parse(body) as unknown[]).length : undefined,
      });
    } catch {
      checks.push({
        table,
        ms: Date.now() - began,
        status: "threw",
      });
    }
  }

  const failed = checks.filter((check) => check.status !== "ok");

  return NextResponse.json(
    {
      ok: failed.length === 0,
      durationMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      checks,
    },
    { status: failed.length === 0 ? 200 : 502 },
  );
}