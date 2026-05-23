create table public.sitemap_checks (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz not null default now(),
  status text not null,
  http_status int,
  content_type text,
  url_count int,
  image_count int,
  latest_lastmod timestamptz,
  duration_ms int,
  error text,
  source text not null default 'cron'
);
create index sitemap_checks_checked_at_idx on public.sitemap_checks (checked_at desc);
alter table public.sitemap_checks enable row level security;
create policy "anyone can read sitemap checks" on public.sitemap_checks for select using (true);