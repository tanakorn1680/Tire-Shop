-- ============================================================
-- 0010: รูปสินค้าหลายรูป + รายละเอียดสินค้าสำหรับหน้าเว็บลูกค้า
-- Run AFTER 0009. ปลอดภัยกับข้อมูลเดิม: เพิ่มตาราง/คอลัมน์ใหม่เท่านั้น ไม่ลบ ไม่แก้ข้อมูลเดิม
-- products.image_path ยังเป็น "รูปหลัก" (รูปแรก) เหมือนเดิม รูปทั้งหมดเก็บในตาราง product_images
-- ============================================================

create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

create policy "product_images: staff select"
  on public.product_images for select to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]));

create policy "product_images: staff insert"
  on public.product_images for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));

create policy "product_images: staff update"
  on public.product_images for update to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]))
  with check (public.has_role(array['owner','staff']::public.app_role[]));

create policy "product_images: staff delete"
  on public.product_images for delete to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]));

-- หน้าเว็บลูกค้าอ่านรูปผ่าน view นี้ (เฉพาะสินค้าที่เปิดขาย ไม่เปิดตารางตรงๆ)
create or replace view public.product_images_public as
select i.product_id, i.path, i.sort_order
from public.product_images i
join public.products p on p.id = i.product_id
where p.is_active;

grant select on public.product_images_public to anon, authenticated;

-- เพิ่มข้อมูลที่ลูกค้าควรเห็นในหน้า "รายละเอียดสินค้า" ท้าย view สาธารณะ (คอลัมน์ใหม่ต้องอยู่ท้ายสุดเท่านั้น)
-- ไม่เปิดเผยต้นทุน จำนวนสต็อก รหัสสินค้า ที่เก็บ หรือหมายเหตุตำหนิ/การซ่อม
create or replace view public.products_public as
select
  p.id, p.brand_id, b.name as brand_name, p.name, p.model,
  p.width_mm, p.aspect_ratio, p.rim_inch, p.size_label,
  p.load_index, p.speed_rating, p.sale_price,
  (p.stock_qty > 0) as in_stock, p.image_path,
  p.category_id, c.name as category_name,
  p.product_type,
  p.sort_order,
  p.dot_week, p.dot_year, p.tread_depth_mm, p.condition_note,
  p.wheel_width_in, p.wheel_pcd, p.wheel_bolts, p.wheel_offset_mm
from public.products p
join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = p.category_id
where p.is_active;

grant select on public.products_public to anon, authenticated;
