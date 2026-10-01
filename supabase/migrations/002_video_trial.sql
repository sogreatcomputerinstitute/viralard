-- Free video analysis trial: one video per new account, then Pro is required.
alter table public.profiles
  add column if not exists video_trial_used boolean not null default false,
  add column if not exists subscription_status text;

-- Persona, localisation and thumbnail support for saved hooks.
alter table public.hooks
  add column if not exists persona_id text,
  add column if not exists language text not null default 'none',
  add column if not exists thumbnails jsonb not null default '[]'::jsonb;

-- Keep the free-tier month aligned to UTC so quota resets on the same day for everyone.
create or replace function public.current_month_start()
returns date
language sql
stable
as $$
  select date_trunc('month', now() at time zone 'utc')::date;
$$;

-- Free-tier quota was broken: the route did a plain INSERT, so the second
-- analysis in a month hit a duplicate-key error and the counter never moved
-- past 1. This increments atomically instead of read-modify-write.
create or replace function public.increment_usage(p_month date)
returns integer
language sql
security invoker
as $$
  insert into public.usage_monthly (user_id, month, count)
  values (auth.uid(), p_month, 1)
  on conflict (user_id, month)
  do update set count = public.usage_monthly.count + 1
  returning count;
$$;

grant execute on function public.increment_usage(date) to authenticated;

alter table public.usage_monthly enable row level security;

drop policy if exists usage_update_own on public.usage_monthly;
create policy "usage_update_own" on public.usage_monthly for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);