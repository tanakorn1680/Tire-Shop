-- ============================================================
-- 0012: แก้ไข/ลบประวัติสต็อก (เฉพาะเจ้าของร้าน) + สรุปยอดขายสินค้าขายดี
-- Run AFTER 0011. ปลอดภัยกับข้อมูลเดิม: ไม่ลบ ไม่แก้ข้อมูลเดิม
-- ============================================================

-- แก้ได้เฉพาะ "เหตุผล" และ "วัน-เวลา" (จำนวนก่อน/หลังเป็นข้อเท็จจริงที่ระบบบันทึก จึงไม่ให้แก้)
revoke update on public.stock_history from authenticated;
grant update (occurred_at, reason) on public.stock_history to authenticated;

drop policy if exists "stock_history: owner update" on public.stock_history;
create policy "stock_history: owner update"
  on public.stock_history for update to authenticated
  using (public.has_role(array['owner']::public.app_role[]))
  with check (public.has_role(array['owner']::public.app_role[]));

drop policy if exists "stock_history: owner delete" on public.stock_history;
create policy "stock_history: owner delete"
  on public.stock_history for delete to authenticated
  using (public.has_role(array['owner']::public.app_role[]));

-- สรุปสินค้าขายดี: นับจากรายการ "ลดจำนวน/ลบสินค้า" ที่เหตุผลมีคำว่า "ขาย"
-- p_from/p_to ว่าง = นับทั้งหมด คืนเฉพาะ p_limit อันดับแรก พร้อมยอดรวม (คำนวณในฐานข้อมูล ไม่ดึงประวัติทั้งหมดมาที่เว็บ)
create or replace function public.sales_by_product(
  p_from  timestamptz default null,
  p_to    timestamptz default null,
  p_limit integer default 10
)
returns table (
  product_name   text,
  qty            bigint,
  times          bigint,
  total_qty      bigint,
  total_times    bigint,
  total_products bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with s as (
    select h.product_name, (-h.qty_change)::bigint as q
    from public.stock_history h
    where h.action in ('decrease', 'delete')
      and h.qty_change < 0
      and h.reason ilike '%ขาย%'
      and (p_from is null or h.occurred_at >= p_from)
      and (p_to is null or h.occurred_at < p_to)
  ),
  g as (
    select s.product_name, sum(s.q)::bigint as qty, count(*)::bigint as times
    from s
    group by s.product_name
  )
  select g.product_name, g.qty, g.times,
         (sum(g.qty) over ())::bigint,
         (sum(g.times) over ())::bigint,
         (count(*) over ())::bigint
  from g
  order by g.qty desc, g.times desc, g.product_name
  limit greatest(p_limit, 1)
$$;

revoke all on function public.sales_by_product(timestamptz, timestamptz, integer) from public, anon;
grant execute on function public.sales_by_product(timestamptz, timestamptz, integer) to authenticated;
