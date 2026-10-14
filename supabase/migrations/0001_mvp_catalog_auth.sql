-- ============================================================
-- 0001: MVP slice 1 — admin roles, brands, products, product images
-- Run in Supabase SQL Editor (or `supabase db push`).
-- Status: NOT yet run against a real Supabase project.
-- ============================================================

-- ---------- Roles / profiles ----------
create type public.app_role as enum ('owner', 'staff');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       public.app_role,            -- NULL = no back-office access
  created_at timestamptz not null default now()
);

-- Role check reads the profiles table (never user-editable metadata).
create or replace function public.has_role(allowed public.app_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = any (allowed)
  );
$$;
revoke all on function public.has_role(public.app_role[]) from public, anon;
grant execute on function public.has_role(public.app_role[]) to authenticated;

-- New auth users get a profile with NO role (no access until promoted).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles: owner reads all"
  on public.profiles for select to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

-- No insert policy (trigger handles it). Only owner can change roles.
create policy "profiles: owner updates"
  on public.profiles for update to authenticated
  using (public.has_role(array['owner']::public.app_role[]))
  with check (public.has_role(array['owner']::public.app_role[]));

-- ---------- Shared helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Brands ----------
create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(btrim(name)) > 0),
  created_at timestamptz not null default now()
);

alter table public.brands enable row level security;

create policy "brands: public read"
  on public.brands for select to anon, authenticated
  using (true);

create policy "brands: staff insert"
  on public.brands for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));

create policy "brands: staff update"
  on public.brands for update to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]))
  with check (public.has_role(array['owner','staff']::public.app_role[]));

create policy "brands: owner delete"
  on public.brands for delete to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

-- ---------- Products ----------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid not null references public.brands (id) on delete restrict,
  name                text not null check (length(btrim(name)) > 0),
  model               text,
  width_mm            smallint not null check (width_mm between 100 and 450),
  aspect_ratio        smallint not null check (aspect_ratio between 20 and 95),
  rim_inch            smallint not null check (rim_inch between 8 and 30),
  size_label          text generated always as
                        (width_mm::text || '/' || aspect_ratio::text || 'R' || rim_inch::text) stored,
  load_index          text,
  speed_rating        text,
  cost_price          numeric(12,2) not null check (cost_price >= 0),
  sale_price          numeric(12,2) not null check (sale_price >= 0),
  stock_qty           integer not null default 0 check (stock_qty >= 0),
  low_stock_threshold integer not null default 4 check (low_stock_threshold >= 0),
  image_path          text,                       -- path inside bucket 'product-images'
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index products_size_idx  on public.products (rim_inch, width_mm, aspect_ratio) where is_active;
create index products_brand_idx on public.products (brand_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
revoke all on public.products from anon;   -- cost_price must never be public

create policy "products: staff read"
  on public.products for select to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]));

create policy "products: staff insert"
  on public.products for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));

create policy "products: staff update"
  on public.products for update to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]))
  with check (public.has_role(array['owner','staff']::public.app_role[]));

create policy "products: owner delete"
  on public.products for delete to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

-- Public catalog: only safe columns, active items only, no cost, no exact stock.
-- Intentionally runs with the view owner's rights (bypasses RLS) — it is the
-- ONLY way the public site reads products.
create view public.products_public as
select
  p.id,
  p.brand_id,
  b.name as brand_name,
  p.name,
  p.model,
  p.width_mm,
  p.aspect_ratio,
  p.rim_inch,
  p.size_label,
  p.load_index,
  p.speed_rating,
  p.sale_price,
  (p.stock_qty > 0) as in_stock,
  p.image_path
from public.products p
join public.brands b on b.id = p.brand_id
where p.is_active;

grant select on public.products_public to anon, authenticated;

-- ---------- Storage: product images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: anyone can view via public URL. Only staff can write.
create policy "product-images: staff upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images'
              and public.has_role(array['owner','staff']::public.app_role[]));

create policy "product-images: staff update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images'
         and public.has_role(array['owner','staff']::public.app_role[]))
  with check (bucket_id = 'product-images'
              and public.has_role(array['owner','staff']::public.app_role[]));

create policy "product-images: staff delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images'
         and public.has_role(array['owner','staff']::public.app_role[]));

-- ============================================================
-- AFTER RUNNING (manual, one time):
-- 1) Supabase Dashboard > Authentication > disable public sign-ups.
-- 2) Create the owner user in Authentication > Users.
-- 3) Promote that user:
--      update public.profiles set role = 'owner' where id = '<USER_UUID>';
-- ============================================================
