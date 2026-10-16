-- ============================================================
-- 0007: ลำดับสินค้า (แอดมินลากจัดตำแหน่งในหน้า "สินค้าและสต็อก")
-- Run AFTER 0004. ปลอดภัยกับข้อมูลเดิม: เพิ่มคอลัมน์ใหม่เท่านั้น ไม่ลบ ไม่แก้ข้อมูลเดิม
-- sort_order ว่าง (null) = จัดอัตโนมัติ ตามประเภท แล้วราคาน้อยไปมาก
-- ============================================================

alter table public.products add column if not exists sort_order integer;

-- การจัดลำดับไม่ถือเป็นการ "แก้ไขสินค้า" จึงไม่เปลี่ยนเวลาแก้ไขล่าสุด
create or replace function public.products_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- size_label เป็นคอลัมน์คำนวณ (ยังไม่ถูกคำนวณตอนนี้) จึงไม่นำมาเทียบ
  if (to_jsonb(new) - 'sort_order' - 'updated_at' - 'size_label') is distinct from (to_jsonb(old) - 'sort_order' - 'updated_at' - 'size_label') then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.products_touch_updated_at();

-- เพิ่ม sort_order ท้าย view สาธารณะ (คอลัมน์ใหม่ต้องอยู่ท้ายสุดเท่านั้น)
create or replace view public.products_public as
select
  p.id, p.brand_id, b.name as brand_name, p.name, p.model,
  p.width_mm, p.aspect_ratio, p.rim_inch, p.size_label,
  p.load_index, p.speed_rating, p.sale_price,
  (p.stock_qty > 0) as in_stock, p.image_path,
  p.category_id, c.name as category_name,
  p.product_type,
  p.sort_order
from public.products p
join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = p.category_id
where p.is_active;

grant select on public.products_public to anon, authenticated;

-- บันทึกลำดับทั้งหมดในครั้งเดียว: ids = รหัสสินค้าเรียงตามตำแหน่งที่ต้องการ
-- สินค้าที่ไม่อยู่ในรายการจะกลับเป็นอัตโนมัติ (ส่งรายการว่าง = ล้างลำดับทั้งหมด)
-- ทำงานด้วยสิทธิ์ผู้เรียก จึงยังอยู่ภายใต้ RLS (เฉพาะ owner/staff แก้ได้)
create or replace function public.set_product_order(ids uuid[])
returns void
language sql
set search_path = public
as $$
  update public.products p
     set sort_order = o.pos::int - 1
    from unnest(ids) with ordinality as o(id, pos)
   where p.id = o.id and p.sort_order is distinct from o.pos::int - 1;

  update public.products
     set sort_order = null
   where sort_order is not null and id <> all(ids);
$$;

revoke all on function public.set_product_order(uuid[]) from public, anon;
grant execute on function public.set_product_order(uuid[]) to authenticated;
