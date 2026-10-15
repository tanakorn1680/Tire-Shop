"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Supabase client สำหรับฝั่งเบราว์เซอร์เท่านั้น (ใช้ anon key, RLS คุมสิทธิ์จริง)
// ใช้ตัวเดียวซ้ำทั้งแอป ไม่สร้างใหม่ทุกครั้งที่ import
// ต้องใช้ createBrowserClient (เก็บ session ใน cookie) เพื่อให้ middleware และ layout ฝั่งเซิร์ฟเวอร์เห็น session
// ถ้าใช้ createClient ของ supabase-js จะเก็บใน localStorage ทำให้ล็อกอินแล้วถูกเด้งกลับหน้า /admin/login
let instance: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("ยังไม่ได้ตั้งค่า Supabase (.env.local)");
  instance = createBrowserClient(url, key);
  return instance;
}
