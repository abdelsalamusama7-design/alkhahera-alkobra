-- Sections table: per-section display config
create table public.home_sections (
  key text primary key,
  title text not null,
  enabled boolean not null default true,
  layout text not null default 'grid', -- 'grid' | 'list' | 'circles'
  columns integer not null default 4,
  display_count integer not null default 8,
  load_more_step integer not null default 8,
  max_count integer not null default 48,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.home_sections enable row level security;

create policy "home_sections public read"
  on public.home_sections for select
  using (true);

create policy "home_sections admin write"
  on public.home_sections for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create trigger home_sections_touch
before update on public.home_sections
for each row execute function public.touch_updated_at();

-- Items: pinned articles or custom cards per section
create table public.home_section_items (
  id uuid primary key default gen_random_uuid(),
  section_key text not null references public.home_sections(key) on delete cascade,
  kind text not null default 'article', -- 'article' | 'custom'
  article_id uuid references public.articles(id) on delete cascade,
  custom_title text,
  custom_image text,
  custom_url text,
  custom_source text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'article' and article_id is not null) or
    (kind = 'custom' and custom_title is not null)
  )
);

create index home_section_items_section_idx
  on public.home_section_items(section_key, sort_order);

alter table public.home_section_items enable row level security;

create policy "home_section_items public read"
  on public.home_section_items for select
  using (true);

create policy "home_section_items admin write"
  on public.home_section_items for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create trigger home_section_items_touch
before update on public.home_section_items
for each row execute function public.touch_updated_at();

-- Seed defaults
insert into public.home_sections (key, title, layout, columns, display_count, load_more_step, max_count, sort_order)
values
  ('trending',    'ترند الآن',          'grid', 6, 6,  6,  48, 1),
  ('latest',      'آخر الأخبار',        'grid', 4, 8,  8,  48, 2),
  ('more_latest', 'المزيد من الأخبار',  'grid', 4, 8,  8,  48, 3),
  ('most_read',   'الأكثر قراءة',       'list', 1, 5,  5,  20, 4)
on conflict (key) do nothing;
