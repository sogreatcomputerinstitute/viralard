import { NextResponse } from "next/server";
import { analyzeVideo, deleteVideoFile, uploadVideo } from "@/lib/ai/gemini-video";
import { scoreHook } from "@/lib/engine/score";
import { analyzeNiche } from "@/lib/engine/score";
import { isNiche } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/server";
import { MAX_ANALYSIS_BYTES } from "@/lib/video-trim";

export const runtime = "nodejs";
export const maxDuration = 60;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Expected multipart form data.", 400);
  }

  const file = form.get("video");
  const rawNiche = form.get("niche");

  if (!(file instanceof File)) {
    return fail("No video file attached.", 400);
  }

  if (file.size > MAX_ANALYSIS_BYTES) {
    return fail(
      `That clip is ${(file.size / 1024 / 1024).toFixed(1)}MB, over the ${(MAX_ANALYSIS_BYTES / 1024 / 1024).toFixed(0)}MB transfer limit.`,
      413,
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Sign in to analyse a video.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, video_trial_used")
    .eq("id", auth.user.id)
    .maybeSingle();

  const isPro = profile?.plan === "pro";
  const trialAvailable = profile ? !profile.video_trial_used : true;

  if (!isPro && !trialAvailable) {
    return fail(
      "You have used your free video analysis. Creator Pro includes unlimited video analysis.",
      402,
    );
  }

  const niche = isNiche(rawNiche) ? rawNiche : analyzeNiche(rawNiche);

  let uploaded: Awaited<ReturnType<typeof uploadVideo>> | null = null;
  let claimedTrial = false;

  try {
    uploaded = await uploadVideo(file);

    /*
     * Burn the trial only once the clip actually reached Gemini. Claiming it
     * up front would let one failed upload cost the user their free analysis.
     */
    if (!isPro && trialAvailable) {
      const { data: claimed } = await supabase
        .from("profiles")
        .update({ video_trial_used: true })
        .eq("id", auth.user.id)
        .eq("video_trial_used", false)
        .select("video_trial_used");

      claimedTrial = Boolean(claimed && claimed.length > 0);
    }

    const insight = await analyzeVideo(uploaded);

    const spoken = insight.spoken_hook?.trim() ?? "";
    const onScreen = insight.on_screen_text?.trim() ?? "";

    const strength = spoken.length >= 8 ? scoreHook(spoken, niche) : null;
    const altSource = spoken.length >= 8 ? spoken : onScreen;

    return NextResponse.json({
      insight,
      strength,
      scoredSource: strength ? "speech" : altSource.length >= 8 ? "on_screen_text" : null,
      altSource,
      trialConsumed: claimedTrial,
      trialRemaining: isPro ? null : claimedTrial ? false : trialAvailable,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video analysis failed.";
    return fail(message, 502);
  } finally {
    if (uploaded) await deleteVideoFile(uploaded);
  }
}