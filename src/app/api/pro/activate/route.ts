import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isActivationConfigured, verifyActivationCode } from "@/lib/activation";

export const runtime = "nodejs";

/**
 * Grants Creator Pro against an admin-issued code. Stripe Billing replaces this
 * once checkout is live - it exists so seats can be handed out before then.
 *
 * Auth is required and the caller can only ever activate their own profile,
 * because the id comes from the verified session rather than the request body.
 */
export async function POST(request: Request) {
  if (!isActivationConfigured()) {
    return NextResponse.json(
      { error: "Activation is not configured on this deployment." },
      { status: 503 },
    );
  }

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!code.trim()) {
    return NextResponse.json({ error: "Enter an activation code." }, { status: 400 });
  }

  const verdict = verifyActivationCode(code);

  if (!verdict.ok) {
    return NextResponse.json(
      { error: verdict.reason === "not_configured" ? "Activation is not configured." : "That code is not valid." },
      { status: verdict.reason === "not_configured" ? 503 : 401 },
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Sign in before activating." }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plan: "pro", subscription_status: "activated" })
    .eq("id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: "pro" });
}