-- ============================================================
-- 0005: ประเภทสินค้าให้แอดมินเพิ่มเองได้ (ใช้ตาราง categories เดิม)
-- Run AFTER 0004. ปลอดภัยกับข้อมูลเดิม: เพิ่มคอลัมน์ใหม่เท่านั้น ไม่ลบ ไม่แก้ข้อมูลเดิม
-- product_type ของประเภท = รูปแบบฟอร์มที่ใช้กรอกสินค้าในประเภทนั้น (ยางมือหนึ่ง / ยางมือสอง / ล้อแม็ก)
-- Status: NOT yet run against a real Supabase project (ยังไม่ได้ทดสอบกับ Postgres จริง)
-- ============================================================

alter table public.categories
  add column if not exists product_type public.product_type not null default 'new_tire';
