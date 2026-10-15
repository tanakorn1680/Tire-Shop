"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase client สำหรับฝั่งเบราว์เซอร์เท่านั้น (ใช้ anon key, RLS คุมสิทธิ์จริง)
// ใช้ตัวเดียวซ้ำทั้งแอป ไม่สร้างใหม่ทุกครั้งที่ import
let instance: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("ยังไม่ได้ตั้งค่า Supabase (.env.local)");
  instance = createClient(url, key);
  return instance;
}
