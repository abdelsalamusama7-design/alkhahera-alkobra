-- نوع حالة الصحة
do $$ begin
  create type public.ad_health as enum ('ok','failed','unknown');
exception when duplicate_object then null; end $$;

-- جدول الإعلانات
create table if not exists public.ad_placements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slot text not null,
  type text not null,
  enabled boolean not null default true,
  order_index int not null default 0,
  is_fallback boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  health_status public.ad_health not null default 'unknown',
  fail_count int not null default 0,
  last_checked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ad_placements_slot on public.ad_placements(slot) where enabled;
create index if not exists idx_ad_placements_health on public.ad_placements(health_status);

-- سجل الفحص
create table if not exists public.ad_health_log (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid references public.ad_placements(id) on delete cascade,
  status public.ad_health not null,
  http_status int,
  error text,
  checked_at timestamptz not null default now()
);

create index if not exists idx_ad_health_log_placement on public.ad_health_log(placement_id, checked_at desc);

-- تفعيل RLS
alter table public.ad_placements enable row level security;
alter table public.ad_health_log enable row level security;

-- السياسات: قراءة عامة للمفعّل (عشان الموقع يعرضها)
create policy "ad_placements public read enabled"
  on public.ad_placements for select
  using (enabled = true);

create policy "ad_placements admin read all"
  on public.ad_placements for select
  using (public.has_role(auth.uid(), 'admin'::app_role));

create policy "ad_placements admin write"
  on public.ad_placements for all
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

create policy "ad_health_log admin read"
  on public.ad_health_log for select
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- تحديث updated_at تلقائي
create trigger trg_ad_placements_updated
  before update on public.ad_placements
  for each row execute function public.touch_updated_at();

-- بيانات افتراضية
insert into public.ad_placements (name, slot, type, enabled, order_index, is_fallback, config)
values
  ('بانر سمارت لينك — منتصف الرئيسية', 'home-middle', 'smartlink-banner', true, 0, false, '{"label":"عروض حصرية اليوم — اطّلع الآن"}'::jsonb),
  ('بانر سمارت لينك — منتصف المقال', 'article-middle', 'smartlink-banner', true, 0, false, '{"label":"محتوى مقترح لك"}'::jsonb),
  ('احتياطي — أعلى الرئيسية', 'home-top', 'smartlink-banner', false, 99, true, '{"label":"عرض مميز"}'::jsonb),
  ('احتياطي — أسفل الرئيسية', 'home-bottom', 'smartlink-banner', false, 99, true, '{"label":"اكتشف المزيد"}'::jsonb),
  ('احتياطي — أعلى المقال', 'article-top', 'smartlink-banner', false, 99, true, '{"label":"مقترح لك"}'::jsonb),
  ('احتياطي — أسفل المقال', 'article-bottom', 'smartlink-banner', false, 99, true, '{"label":"شاهد أيضًا"}'::jsonb),
  ('احتياطي — الشريط الجانبي', 'sidebar', 'smartlink-banner', false, 99, true, '{"label":"عروض"}'::jsonb)
on conflict do nothing;