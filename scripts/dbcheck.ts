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

async function currentUserId(): Promise<string | null> {
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=1`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) return null;
  const body = (await response.json()) as { users?: { id: string }[] };
  return body.users?.[0]?.id ?? null;
}

type Profile = { id: string; email: string | null; plan: string; video_trial_used: boolean };

async function main() {
  const userId = await currentUserId();

  if (!userId) {
    console.log("No users signed up yet.");
    return;
  }

  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );

  const profiles = (await response.json()) as Profile[];

  if (profiles.length === 0) {
    console.log(`user ${userId} exists but has NO profile row.`);
    console.log("The on_auth_user_created trigger did not fire. Re-run supabase/schema.sql.");
    return;
  }

  const profile = profiles[0];
  console.log("profile:", profile.email);
  console.log("  plan:", profile.plan);
  console.log("  video_trial_used:", profile.video_trial_used ?? "COLUMN MISSING");

  if (profile.video_trial_used === undefined) {
    console.log("\n  -> run supabase/migrations/002_video_trial.sql in the SQL editor");
  }

  console.log(`\ngrant yourself Pro with:\n  update public.profiles set plan='pro' where id='${userId}';`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});