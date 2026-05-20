
-- Roles
create type public.app_role as enum ('admin', 'editor');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

-- Articles
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text,
  cover_image text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  source text default 'القاهرة الكبرى',
  source_url text,
  is_breaking boolean not null default false,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.articles enable row level security;

create index articles_published_idx on public.articles(is_published, published_at desc);
create index articles_category_idx on public.articles(category_id, published_at desc);
create index articles_search_idx on public.articles using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger articles_touch before update on public.articles
for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- Auto-create profile + first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare user_count int;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  select count(*) into user_count from auth.users;
  if user_count = 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS policies
-- profiles
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- user_roles
create policy "roles select own" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "roles admin manage" on public.user_roles for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- categories
create policy "categories public read" on public.categories for select using (true);
create policy "categories editor write" on public.categories for all
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'));

-- articles
create policy "articles public read published" on public.articles for select using (is_published = true);
create policy "articles editor read all" on public.articles for select using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'));
create policy "articles editor write" on public.articles for all
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'));

-- Seed categories
insert into public.categories (slug, name, sort_order) values
  ('politics','سياسة',1),
  ('economy','اقتصاد',2),
  ('sports','رياضة',3),
  ('arts','فن',4),
  ('accidents','حوادث',5),
  ('reports','تقارير',6),
  ('miscellaneous','منوعات',7),
  ('world','العالم',8);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('article-images','article-images', true);

create policy "article images public read" on storage.objects for select using (bucket_id = 'article-images');
create policy "article images editor write" on storage.objects for insert
  with check (bucket_id = 'article-images' and (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor')));
create policy "article images editor update" on storage.objects for update
  using (bucket_id = 'article-images' and (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor')));
create policy "article images editor delete" on storage.objects for delete
  using (bucket_id = 'article-images' and (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor')));
