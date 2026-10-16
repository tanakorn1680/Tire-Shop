-- ============================================================
-- 0011: ประวัติสต็อก (เพิ่มสินค้าใหม่ / เพิ่ม-ลดจำนวน / ลบสินค้า) พร้อมเหตุผลที่แอดมินพิมพ์เอง
-- Run AFTER 0010. ปลอดภัยกับข้อมูลเดิม: เพิ่มตารางใหม่เท่านั้น ไม่ลบ ไม่แก้ข้อมูลเดิม
-- ประวัติแก้/ลบไม่ได้ (ไม่มี policy update/delete) และไม่หายแม้สินค้าถูกลบ (เก็บชื่อสินค้าไว้ในแถวเอง)
-- ============================================================

create table if not exists public.stock_history (
  id           uuid primary key default gen_random_uuid(),
  occurred_at  timestamptz not null default now(),      -- วัน-เวลาที่เกิดเหตุการณ์ (แอดมินแก้ได้)
  created_at   timestamptz not null default now(),      -- เวลาที่ระบบบันทึกจริง
  action       text not null check (action in ('add', 'increase', 'decrease', 'delete')),
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  qty_before   integer,
  qty_after    integer,
  qty_change   integer,
  reason       text,                                    -- เช่น ขายแล้ว / ซื้อจากร้าน ABC (พิมพ์เอง)
  created_by   uuid default auth.uid()
);
create index if not exists stock_history_time_idx on public.stock_history (occurred_at desc);
create index if not exists stock_history_product_idx on public.stock_history (product_id);

alter table public.stock_history enable row level security;

create policy "stock_history: staff select"
  on public.stock_history for select to authenticated
  using (public.has_role(array['owner','staff']::public.app_role[]));

create policy "stock_history: staff insert"
  on public.stock_history for insert to authenticated
  with check (public.has_role(array['owner','staff']::public.app_role[]));
