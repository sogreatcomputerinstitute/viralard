import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}