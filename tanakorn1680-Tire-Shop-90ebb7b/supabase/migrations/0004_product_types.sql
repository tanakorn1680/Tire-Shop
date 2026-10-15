-- ============================================================
-- 0004: แยกประเภทสินค้า (ยางมือ 1 / ยางมือสอง / ล้อแม็ก)
-- Run AFTER 0001, 0002, 0003.
-- ปลอดภัยกับข้อมูลเดิม: เพิ่มคอลัมน์ใหม่เท่านั้น ไม่ลบ ไม่แก้ข้อมูลเดิม
-- สินค้าเดิมทุกรายการจะกลายเป็น 'new_tire' (ยางมือ 1) โดยอัตโนมัติ
-- Status: NOT yet run against a real Supabase project (ยังไม่ได้ทดสอบกับ Postgres จริง)
-- ============================================================

create type public.product_type as enum ('new_tire', 'used_tire', 'wheel');

alter table public.products
  add column product_type     public.product_type not null default 'new_tire',
  add column sku              text,                 -- รหัสสินค้า
  add column storage_location text,                 -- ตำแหน่งจัดเก็บ
  add column is_individual    boolean not null default false,  -- true = ติดตามรายเส้น/รายวง (จำนวนได้ไม่เกิน 1)
  -- DOT (สัปดาห์/ปีผลิต)
  add column dot_week         smallint check (dot_week between 1 and 53),
  add column dot_year         smallint check (dot_year between 2000 and 2100),
  -- ยางมือสอง
  add column tread_depth_mm   numeric(3,1) check (tread_depth_mm between 0 and 15),
  add column condition_note   text,                 -- สภาพ (ใช้กับล้อแม็กด้วย)
  add column defect_note      text,                 -- ตำหนิ
  add column repair_note      text,                 -- รอยซ่อม
  -- ล้อแม็ก (ขนาดนิ้วใช้คอลัมน์ rim_inch เดิม)
  add column wheel_width_in   numeric(3,1) check (wheel_width_in between 3 and 20),
  add column wheel_pcd        text,                 -- เช่น 5x114.3
  add column wheel_bolts      smallint check (wheel_bolts between 3 and 10),
  add column wheel_offset_mm  smallint check (wheel_offset_mm between -100 and 150);

-- ล้อแม็กไม่มี "กว้าง/ซีรีย์" แบบยาง จึงต้องยอมให้ว่างได้
alter table public.products
  alter column width_mm drop not null,
  alter column aspect_ratio drop not null;

-- ยางต้องมีขนาดครบ 3 ค่า / ล้อแม็กต้องมีขนาดนิ้ว (rim_inch)
alter table public.products
  add constraint products_size_by_type_chk check (
    (product_type = 'wheel' and rim_inch is not null)
    or
    (product_type <> 'wheel' and width_mm is not null and aspect_ratio is not null and rim_inch is not null)
  );

-- สินค้าที่ติดตามรายเส้น มีได้ 0 หรือ 1 เท่านั้น (กันขายซ้ำ/ขายเกิน)
alter table public.products
  add constraint products_individual_qty_chk check (not is_individual or stock_qty <= 1);

-- รหัสสินค้าห้ามซ้ำ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) ปล่อยว่างได้
create unique index products_sku_key on public.products (lower(sku)) where sku is not null;
create index products_type_idx on public.products (product_type);

-- เพิ่ม product_type ท้าย view สาธารณะ (คอลัมน์ใหม่ต้องอยู่ท้ายสุดเท่านั้น)
create or replace view public.products_public as
select
  p.id, p.brand_id, b.name as brand_name, p.name, p.model,
  p.width_mm, p.aspect_ratio, p.rim_inch, p.size_label,
  p.load_index, p.speed_rating, p.sale_price,
  (p.stock_qty > 0) as in_stock, p.image_path,
  p.category_id, c.name as category_name,
  p.product_type
from public.products p
join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = p.category_id
where p.is_active;

grant select on public.products_public to anon, authenticated;
