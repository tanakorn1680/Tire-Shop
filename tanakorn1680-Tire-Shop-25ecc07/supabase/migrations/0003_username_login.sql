-- ============================================================
-- 0003: เข้าสู่ระบบด้วย username ได้ นอกเหนือจากอีเมล
-- Run AFTER 0001 และ 0002. Status: NOT yet run against a real Supabase project.
-- ============================================================

-- ---------- Profiles: เพิ่มคอลัมน์ username ----------
alter table public.profiles
  add column username text unique check (username is null or length(btrim(username)) >= 3);

-- ---------- Trigger ตอนสมัครผู้ใช้ใหม่: ดึง username จาก user metadata ด้วย ----------
-- ตั้งค่าตอนสร้าง user ใน Supabase Dashboard > Authentication > Users
-- ช่อง "User Metadata" ใส่ {"username": "ชื่อที่ต้องการ", "full_name": "ชื่อเต็ม"}
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(btrim(new.raw_user_meta_data ->> 'username'), '')
  );
  return new;
end;
$$;

-- ---------- ค้นหาอีเมลจาก username (ใช้ก่อนล็อกอิน ตอนยังไม่มี session) ----------
-- security definer เพราะ anon ยังไม่มีสิทธิ์อ่านตาราง profiles ตรงๆ
-- คืนเฉพาะอีเมลเท่านั้น ไม่เปิดเผยข้อมูลอื่นของผู้ใช้
create or replace function public.email_for_username(lookup_username text)
returns text
language sql stable security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = btrim(lookup_username)
  limit 1;
$$;

revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;
