-- ============================================================
-- 0014: ข้อมูลรุ่นรถ -> ขนาดยางที่ใช้ได้ (สำหรับช่อง "ค้นหาจากรุ่นรถ" หน้าเว็บลูกค้า)
-- Run AFTER 0012. เพิ่มตารางใหม่เท่านั้น ไม่แก้ข้อมูลเดิม
-- ตารางว่างตอนเริ่ม: แอดมินเพิ่มเองที่เมนู "รุ่นรถ" และช่องค้นหาจากรุ่นรถจะขึ้นเมื่อมีข้อมูลอย่างน้อย 1 รายการ
-- ============================================================

create table if not exists public.car_fitments (
  id         uuid primary key default gen_random_uuid(),
  brand      text not null check (length(btrim(brand)) > 0),   -- ยี่ห้อรถ เช่น Toyota
  model      text not null check (length(btrim(model)) > 0),   -- รุ่นรถ เช่น Vios
  variant    text not null default '',                          -- ปีรถ / รุ่นย่อย เช่น 2013-2022 1.5 J (ว่าง = ทุกปี)
  sizes      text[] not null check (cardinality(sizes) > 0),   -- เช่น {185/60R15,185/55R16}
  created_at timestamptz not null default now()
);

create unique index if not exists car_fitments_uniq
  on public.car_fitments (lower(brand), lower(model), lower(variant));

alter table public.car_fitments enable row level security;

drop policy if exists "car_fitments: public read" on public.car_fitments;
create policy "car_fitments: public read"
  on public.car_fitments for select to anon, authenticated using (true);

drop policy if exists "car_fitments: staff insert" on public.car_fitments;
create policy "car_fitments: staff insert"
  on public.car_fitments for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));

drop policy if exists "car_fitments: staff update" on public.car_fitments;
create policy "car_fitments: staff update"
  on public.car_fitments for update to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]))
  with check (public.has_role(array['owner','staff']::public.app_role[]));

drop policy if exists "car_fitments: owner delete" on public.car_fitments;
create policy "car_fitments: owner delete"
  on public.car_fitments for delete to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

-- ------------------------------------------------------------
-- ย้อนกลับ 0013_public_defect_repair.sql (ไฟล์นั้นยกเลิกแล้ว ไม่ต้องรัน)
-- ถ้าเคยรัน 0013 ไปแล้ว บล็อกนี้จะคืน view สาธารณะเป็นแบบเดิม (ไม่เปิดตำหนิ/รอยซ่อมให้ลูกค้า) ถ้าไม่เคยรัน บล็อกนี้ไม่มีผลเสีย
-- ------------------------------------------------------------
drop view if exists public.products_public;
create view public.products_public as
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
