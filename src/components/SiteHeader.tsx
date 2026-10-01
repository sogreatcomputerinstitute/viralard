import Link from "next/link";

export function BuildStamp() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  if (!commit) return null;

  return (
    <span className="text-[10px] tabular-nums text-ink-muted/50" title="Deployed commit">
      {commit}
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
<span className="grid size-8 place-items-center rounded-xl bg-white/6 p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={24} height={24} />
        </span>
      <span className="text-[15px] font-semibold tracking-tight">Viralard</span>
    </Link>
  );
}

export function SiteHeader({
  email,
  signedIn,
}: {
  email: string | null;
  signedIn: boolean;
}) {
  return (
    <header className="glass-chrome sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-5">
        <Logo />

        <nav className="flex items-center gap-2">
          <Link href="/app" className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/6 hover:text-zinc-50">
            Analyzer
          </Link>

{signedIn && email ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="flex items-center gap-2.5 rounded-full border border-white/10 py-1 pl-1 pr-3 transition hover:border-accent/40"
              >
                <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-[11px] font-bold text-white">
                  {email.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-40 truncate text-xs text-zinc-400 sm:block">{email}</span>
              </Link>

              <form action="/api/auth/signout" method="post">
                <button type="submit" className="text-xs text-zinc-500 transition hover:text-zinc-200">
                  Sign out
                </button>
              </form>
              <BuildStamp />
            </div>
          ) : (
            <Link href="/login" className="btn-ghost px-4 py-1.5 text-xs">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}