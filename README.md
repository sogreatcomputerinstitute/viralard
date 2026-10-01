# Viralard

Live feed hijack and short-form script simulator for TikTok, Reels and Shorts creators.

Score a video hook on four deterministic metrics, rewrite it into three proven structures, then check it
against the platform UI before you film.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4, custom glass utilities |
| Auth + database | Supabase (PostgreSQL, RLS on every table) |
| AI | Google Gemini Flash via REST, with a model fallback chain |
| Motion | GSAP + ScrollTrigger |
| Hosting | Vercel |

The scoring engine is plain TypeScript and makes **zero API calls**. Gemini is only used to generate rewrites,
thumbnails and video transcripts, so the score is reproducible and free to run.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open http://localhost:3000.

### Database

Run `supabase/schema.sql` in the Supabase SQL Editor, then
`supabase/migrations/002_video_trial.sql`. The second one is required before login, the free quota counter,
saved history or Pro activation will work.

## Environment variables

Set these in `.env.local` for development and in the Vercel project settings for production.

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Google AI Studio key. Free tier is enough to launch. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Safe to expose to the browser. RLS protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Server only.** Bypasses RLS. Never prefix with `NEXT_PUBLIC_`. |
| `PRO_ACTIVATION_CODES` | no | Comma separated. Temporary path to grant Pro before Stripe is wired. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Absolute site URL, used for canonical tags, sitemap and JSON-LD. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | no | Analytics. Nothing loads when unset. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | no | Phase 5. |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). Framework preset: Next.js. No build overrides.
3. Add every environment variable above under **Project Settings → Environment Variables**.
4. Deploy. Production builds are unaffected by stale local caches, so a clean deploy is the safest way to
   confirm route health.

After the first deploy, add `http://localhost:3000/**` and your production URL to
**Supabase → Authentication → URL Configuration → Redirect URLs**, otherwise the Google callback is rejected
after a successful login.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run engine -- score` | Score the built-in sample hooks and print the full rubric breakdown |
| `npm run engine -- one "your hook"` | Score one line |
| `npm run engine -- rewrite "your hook" [niche]` | Score plus live Gemini rewrites |
| `npm run engine -- compare` | Run the 4x25 rubric against the earlier one and flag regressions |
| `npm run auth:check` | Verify which Supabase OAuth providers are enabled |
| `npm run db:check` | Verify the schema, profile row and quota columns |
| `npm run db:migrate` | Apply pending SQL over the PostgREST endpoint |

## Known limitations

- **Competitor scout does not auto-fetch captions.** Scraping YouTube violates their terms of service. Paste
  a transcript instead; the extraction and scoring are identical. The official Data API path is stubbed in
  `src/lib/scout.ts`.
- **Video analysis is Chrome and Edge only.** The in-browser trim needs `MediaRecorder` plus `captureStream`.
  Safari and Firefox users get a message pointing them at text input.
- **Video analysis is cut client-side** to the first 5 seconds before upload. Vercel rejects request bodies
  over 4.5MB and there is no flag to raise that, so only the trimmed clip is ever transferred. Nothing is
  stored.
- **Safe zone masks are hand-tuned.** Platforms move their UI periodically. Update
  `src/lib/safezone.ts` when they do.
- **Scores are not retention predictions.** There is a deterministic rubric, no cohort data and no access to
  analytics.