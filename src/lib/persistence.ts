import { createClient } from "@/lib/supabase/server";
import type { HookStrengthResult, Niche, Rewrite } from "@/lib/engine/types";

/**
 * Persists an analysis.
 *
 * Optional columns are dropped one at a time when Postgres reports an unknown
 * column. That is not defensive noise: a migration that has not been applied
 * silently costs you every saved hook, because the insert fails as a batch and
 * nothing is written. Degrading per column means a schema drift costs the
 * affected field instead of the whole history.
 */
export type SaveResult = {
  hookId: string | null;
  rewritesSaved: number;
  degraded: string[];
};

type HookRow = {
  user_id: string;
  text: string;
  niche: string;
  total: number;
  band: string;
  pillars: unknown;
  signals: unknown;
  advice: unknown;
  persona_id?: string | null;
  language?: string;
  thumbnails?: string[];
};

const OPTIONAL: (keyof HookRow)[] = ["thumbnails", "language", "persona_id"];

function isMissingColumn(error: { code?: string }): boolean {
  return error.code === "42703" || error.code === "PGRST204";
}

export async function saveAnalysis(input: {
  userId: string;
  niche: Niche;
  personaId: string | null;
  language: string;
  strength: HookStrengthResult;
  rewrites: Rewrite[];
  thumbnails: string[];
}): Promise<SaveResult> {
  const supabase = await createClient();

  const full: HookRow = {
    user_id: input.userId,
    text: input.strength.text,
    niche: input.niche,
    total: input.strength.total,
    band: input.strength.band,
    pillars: input.strength.pillars,
    signals: input.strength.signals,
    advice: input.strength.advice,
    persona_id: input.personaId,
    language: input.language,
    thumbnails: input.thumbnails,
  };

  const dropped = new Set<keyof HookRow>();
  let hookId: string | null = null;

  for (let attempt = 0; attempt <= OPTIONAL.length; attempt += 1) {
    const row = { ...full };
    for (const column of dropped) delete row[column];

    const { data, error } = await supabase.from("hooks").insert(row).select("id").single();

    if (!error) {
      hookId = data?.id ?? null;
      break;
    }

    const offending = OPTIONAL.find(
      (column) => !dropped.has(column) && isMissingColumn(error as { code?: string }) && error.message.includes(column),
    );

    if (!offending) {
      console.error("hook insert failed", error.code, error.message);
      return { hookId: null, rewritesSaved: 0, degraded: [...dropped] };
    }

    dropped.add(offending);
  }

  if (!hookId) return { hookId: null, rewritesSaved: 0, degraded: [...dropped] };

  const usable = input.rewrites.filter((rewrite) => rewrite.text);

  if (usable.length === 0) {
    return { hookId, rewritesSaved: 0, degraded: [...dropped] };
  }

  const { error: rewriteError } = await supabase.from("rewrites").insert(
    usable.map((rewrite) => ({
      hook_id: hookId,
      user_id: input.userId,
      pattern: rewrite.pattern,
      title: rewrite.title,
      text: rewrite.text,
      rationale: rewrite.rationale,
    })),
  );

  if (rewriteError) {
    console.error("rewrites insert failed", rewriteError.code, rewriteError.message);
    return { hookId, rewritesSaved: 0, degraded: [...dropped] };
  }

  return { hookId, rewritesSaved: usable.length, degraded: [...dropped] };
}