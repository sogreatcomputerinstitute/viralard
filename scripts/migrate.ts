import { readFileSync } from "node:fs";

/**
 * Applies pending SQL through the Supabase PostgREST endpoint.
 *
 * Runs as the service role against /rest/v1/rpc/exec_sql, which requires that
 * function to exist. Create it once in the SQL editor:
 *
 *   create or replace function public.exec_sql(query text)
 *   returns void language plpgsql security definer as $$
 *   begin execute query; end; $$;
 *
 *   revoke execute on function public.exec_sql(text) from public, anon, authenticated;
 *   grant  execute on function public.exec_sql(text) to service_role;
 *
 * With that in place this script can run migrations without the Supabase CLI,
 * which needs a personal access token.
 */

type Statement = { label: string; sql: string };

async function post(sql: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Supabase env vars are missing.");

  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`${response.status}: ${detail}`);
  }
}

/**
 * Statements are split on semicolons at end of line. This is safe for the
 * migration files here because none of them contain a semicolon inside a string
 * literal or a dollar-quoted body in the parts we split.
 */
function split(sql: string): string[] {
  return sql
    .split(/;\s*\r?\n/)
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((chunk) => chunk.length > 0 && !/^create\s+extension/i.test(chunk));
}

async function main() {
  const target = process.argv[2] ?? "supabase/schema.sql";
  const sql = readFileSync(target, "utf8");
  const statements: Statement[] = split(sql);

  console.log(`${target}: ${statements.length} statements\n`);

  let applied = 0;
  const failures: string[] = [];

  for (const [index, statement] of statements.entries()) {
    const label = statement.split("\n")[0].slice(0, 62);
    try {
      await post(statement);
      applied += 1;
      console.log(`  ok    ${index + 1}/${statements.length}  ${label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  FAIL  ${index + 1}/${statements.length}  ${label}`);
      failures.push(`${label}\n      ${message}`);
    }
  }

  console.log(`\napplied ${applied}/${statements.length}`);

  if (failures.length > 0) {
    console.log("\nfailures:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});