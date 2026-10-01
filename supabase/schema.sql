create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  subscription_status text,
  credits integer not null default 0 check (credits >= 0),
  video_trial_used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.hooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  text text not null check (char_length(text) between 8 and 250),
  niche text not null default 'general',
  total smallint not null check (total between 0 and 100),
  band text not null check (band in ('strong', 'workable', 'weak')),
  pillars jsonb not null default '{}'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  advice jsonb not null default '[]'::jsonb,
  persona_id text,
  language text not null default 'none',
  thumbnails jsonb not null default '[]'::jsonb,
  video_analyzed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists hooks_user_created_idx on public.hooks (user_id, created_at desc);

create table if not exists public.rewrites (
  id uuid primary key default gen_random_uuid(),
  hook_id uuid not null references public.hooks on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  pattern text not null check (pattern in ('pattern_interrupt', 'negative_frame', 'curiosity_loop')),
  title text not null,
  text text not null,
  rationale text,
  created_at timestamptz not null default now()
);

create index if not exists rewrites_hook_idx on public.rewrites (hook_id);

create table if not exists public.usage_monthly (
  user_id uuid not null references auth.users on delete cascade,
  month date not null,
  count integer not null default 0,
  primary key (user_id, month)
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  amount integer not null,
  reason text not null,
  stripe_event_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

create table if not exists public.analyze_cache (
  key text primary key,
  strength jsonb not null,
  rewrites jsonb not null,
  niche text not null default 'general',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.hooks enable row level security;
alter table public.rewrites enable row level security;
alter table public.usage_monthly enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.analyze_cache enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "hooks_select_own" on public.hooks for select using (auth.uid() = user_id);
create policy "hooks_insert_own" on public.hooks for insert with check (auth.uid() = user_id);
create policy "hooks_delete_own" on public.hooks for delete using (auth.uid() = user_id);

create policy "rewrites_select_own" on public.rewrites for select using (auth.uid() = user_id);
create policy "rewrites_insert_own" on public.rewrites for insert with check (auth.uid() = user_id);

create policy "usage_select_own" on public.usage_monthly for select using (auth.uid() = user_id);
create policy "usage_upsert_own" on public.usage_monthly for insert
  with check (auth.uid() = user_id);

create policy "ledger_select_own" on public.credit_ledger for select using (auth.uid() = user_id);

create policy "cache_read_all" on public.analyze_cache for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();