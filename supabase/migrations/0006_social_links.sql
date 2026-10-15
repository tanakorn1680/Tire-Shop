-- ============================================================
-- 0006: ลิงก์ Facebook และ Messenger ของร้าน (ตั้งค่าร้าน)
-- Run AFTER 0005. ปลอดภัยกับข้อมูลเดิม: เพิ่มคอลัมน์ใหม่เท่านั้น ไม่ลบ ไม่แก้ข้อมูลเดิม
-- messenger_url ใช้เป็นปุ่ม "สั่งซื้อทาง Messenger" ในหน้าเว็บลูกค้า
-- Status: NOT yet run against a real Supabase project (ยังไม่ได้ทดสอบกับ Postgres จริง)
-- ============================================================

alter table public.store_settings
  add column if not exists facebook_url  text,
  add column if not exists messenger_url text;
