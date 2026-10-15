import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Supabase client สำหรับ Server Component / Server Action / Route Handler
// อ่าน session จาก cookie จริง เพื่อให้ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์ได้ (ไม่ใช่แค่ซ่อนปุ่มฝั่ง client)
export async function sbServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("ยังไม่ได้ตั้งค่า Supabase (.env.local)");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // เรียกจาก Server Component (ไม่ใช่ Server Action) จะเขียน cookie ไม่ได้
          // middleware เป็นคนรีเฟรช session แทน ข้ามได้อย่างปลอดภัย
        }
      },
    },
  });
}

// ดึงผู้ใช้ปัจจุบัน + role จากตาราง profiles (ใช้ในทุกหน้า admin)
export async function getAdminUser() {
  const supabase = await sbServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as "owner" | "staff" | null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return { user, role: (profile?.role ?? null) as "owner" | "staff" | null };
}
