-- ============================================================
-- 0002: store settings, categories, services (all content is entered by admin)
-- Run AFTER 0001. Status: NOT yet run against a real Supabase project.
-- ============================================================

-- ---------- Store settings (single row, all fields start empty) ----------
create table public.store_settings (
  id         smallint primary key default 1 check (id = 1),
  store_name text,
  tagline    text,
  phone      text,
  hours      text,
  address    text,
  line_url   text,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1) on conflict do nothing;

create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;

create policy "store_settings: public read"
  on public.store_settings for select to anon, authenticated
  using (true);

create policy "store_settings: owner update"
  on public.store_settings for update to authenticated
  using (public.has_role(array['owner']::public.app_role[]))
  with check (public.has_role(array['owner']::public.app_role[]));

-- ---------- Categories ----------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (length(btrim(name)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: public read"
  on public.categories for select to anon, authenticated using (true);
create policy "categories: staff insert"
  on public.categories for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));
create policy "categories: staff update"
  on public.categories for update to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]))
  with check (public.has_role(array['owner','staff']::public.app_role[]));
create policy "categories: owner delete"
  on public.categories for delete to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

alter table public.products
  add column category_id uuid references public.categories (id) on delete restrict;
create index products_category_idx on public.products (category_id);

-- ---------- Services ----------
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "services: public read active"
  on public.services for select to anon, authenticated
  using (is_active);
create policy "services: staff read all"
  on public.services for select to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]));
create policy "services: staff insert"
  on public.services for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));
create policy "services: staff update"
  on public.services for update to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]))
  with check (public.has_role(array['owner','staff']::public.app_role[]));
create policy "services: owner delete"
  on public.services for delete to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

-- ---------- Public catalog view: add category (new columns go last) ----------
create or replace view public.products_public as
select
  p.id, p.brand_id, b.name as brand_name, p.name, p.model,
  p.width_mm, p.aspect_ratio, p.rim_inch, p.size_label,
  p.load_index, p.speed_rating, p.sale_price,
  (p.stock_qty > 0) as in_stock, p.image_path,
  p.category_id, c.name as category_name
from public.products p
join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = p.category_id
where p.is_active;

grant select on public.products_public to anon, authenticated;
