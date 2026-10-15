// สคริปต์รันครั้งเดียวบนเครื่องของเจ้าของร้านเท่านั้น (ไม่ใช่ส่วนหนึ่งของเว็บแอป ไม่ deploy)
// ใช้ Supabase Admin API สร้างบัญชี owner คนแรก พร้อมอีเมล + username + รหัสผ่าน
//
// วิธีใช้:
// 1) ติดตั้ง dependency ครั้งเดียว:   npm install @supabase/supabase-js
// 2) แก้ 3 ค่าด้านล่าง (EMAIL, USERNAME, PASSWORD)
// 3) หา service_role key จาก Supabase Dashboard > Project Settings > API
//    (คนละตัวกับ anon key ที่ใช้ใน .env.local — ห้ามใส่ลงเว็บแอปหรือ commit เด็ดขาด)
// 4) รันคำสั่งนี้ในเทอร์มินัล (ใส่ค่าจริงแทน):
//
//    SUPABASE_URL="https://xxxx.supabase.co" \
//    SUPABASE_SERVICE_ROLE_KEY="ใส่ service_role key ตรงนี้" \
//    node scripts/create-owner.mjs
//
// 5) เสร็จแล้วลบ terminal history / ปิดหน้าต่างที่พิมพ์ key ไว้ ไม่ต้องเก็บ key นี้ไว้ที่ไหนถาวร

import { createClient } from "@supabase/supabase-js";

const EMAIL = "owner@example.com";      // แก้เป็นอีเมลจริง
const USERNAME = "somchai";             // แก้เป็น username ที่ต้องการ
const PASSWORD = "เปลี่ยนรหัสผ่านนี้ก่อนรัน123"; // แก้เป็นรหัสผ่านจริง (อย่างน้อย 6 ตัวอักษร)

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("ต้องตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ก่อนรัน (ดูวิธีใช้ด้านบนของไฟล์นี้)");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // 1) สร้างผู้ใช้ผ่าน Admin API — ยืนยันอีเมลทันที ไม่ต้องกดลิงก์
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { username: USERNAME },
  });

  if (createError) {
    console.error("สร้างผู้ใช้ไม่สำเร็จ:", createError.message);
    process.exit(1);
  }

  const userId = created.user.id;
  console.log(`สร้างผู้ใช้สำเร็จ: ${EMAIL} (id: ${userId})`);
  console.log("trigger ในฐานข้อมูลจะสร้างแถวใน public.profiles ให้อัตโนมัติ (รวม username)");

  // 2) promote เป็น owner
  const { error: updateError } = await admin
    .from("profiles")
    .update({ role: "owner" })
    .eq("id", userId);

  if (updateError) {
    console.error("สร้างผู้ใช้สำเร็จ แต่ promote เป็น owner ไม่สำเร็จ:", updateError.message);
    console.error(`รัน SQL นี้เองใน SQL Editor แทน: update public.profiles set role = 'owner' where id = '${userId}';`);
    process.exit(1);
  }

  console.log("ตั้งสิทธิ์ owner สำเร็จ — ล็อกอินได้ที่ /admin/login ด้วยอีเมลหรือ username ข้างต้น");
}

main();
