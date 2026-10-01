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

async function checkProvider(provider: string): Promise<void> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const redirect = "http://localhost:3000/api/auth/callback";

  const target = `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirect)}`;

  const response = await fetch(target, {
    headers: { apikey: key },
    redirect: "manual",
  });

  console.log(`\n${provider}: status=${response.status}`);

  if (response.status === 302) {
    const location = response.headers.get("location") ?? "";
    console.log("  provider OK -> redirecting to Google");
    console.log(`  client_id: ${new URL(location).searchParams.get("client_id") ?? "(none)"}`);
    console.log(
      `  redirect_uri: ${new URL(location).searchParams.get("redirect_uri") ?? new URL(location).searchParams.get("redirect_to") ?? "(none)"}`,
    );
    console.log(`  full: ${location}`);
    return;
  }

  const body = await response.text();
  console.log(`  body: ${body.replace(/\s+/g, " ").slice(0, 200)}`);
}

async function main() {
  console.log("Testing which providers are actually enabled on this project.\n");
  await checkProvider("google");
  await checkProvider("github");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});