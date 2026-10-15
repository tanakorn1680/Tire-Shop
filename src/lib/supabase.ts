import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

export type Product = {
  id: string; brand_name: string; name: string; model: string | null;
  size_label: string; load_index: string | null; speed_rating: string | null;
  sale_price: number; in_stock: boolean; image_path: string | null;
  category_id: string | null; category_name: string | null;
};
export type Settings = {
  store_name: string | null; tagline: string | null; phone: string | null;
  hours: string | null; address: string | null; line_url: string | null;
  facebook_url: string | null; messenger_url: string | null;
};
export type Named = { id: string; name: string; description?: string | null };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = () => (url && key ? createClient(url, key) : null);

export const t = (v?: string | null) => v?.trim() ?? "";
export const hasContact = (s: Partial<Settings>) =>
  !!(t(s.phone) || t(s.hours) || t(s.address) || t(s.line_url) || t(s.facebook_url));

export const imageUrl = (path?: string | null) =>
  path && url ? `${url}/storage/v1/object/public/product-images/${path}` : null;

// ข้อมูลร้านทั้งหมดจากฐานข้อมูล (ว่างได้) — ใช้ซ้ำในหลายคอมโพเนนต์โดยยิงครั้งเดียวต่อคำขอ
export const getSite = cache(async () => {
  const sb = client();
  let settings: Partial<Settings> = {};
  let categories: Named[] = [];
  let services: Named[] = [];
  if (sb) {
    // ถ้ายังไม่ได้รัน migration 0006 (คอลัมน์ facebook_url/messenger_url) ให้ใช้คอลัมน์เดิมไปก่อน เว็บจะได้ไม่ว่างเปล่า
    const base = "store_name,tagline,phone,hours,address,line_url";
    const loadSettings = async () => {
      const full = await sb.from("store_settings").select(`${base},facebook_url,messenger_url`).eq("id", 1).maybeSingle();
      return full.error ? sb.from("store_settings").select(base).eq("id", 1).maybeSingle() : full;
    };
    const [s, c, v, u] = await Promise.all([
      loadSettings(),
      sb.from("categories").select("id,name").order("sort_order").order("name"),
      sb.from("services").select("id,name,description").eq("is_active", true).order("sort_order"),
      sb.from("products_public").select("category_id"),
    ]);
    settings = (s.data ?? {}) as Partial<Settings>;
    // แสดงเฉพาะประเภทที่มีสินค้าอยู่จริง ถ้ายังไม่มีเลยจะเหลือแค่ "ทั้งหมด"
    const used = new Set(((u.data ?? []) as { category_id: string | null }[]).map((p) => p.category_id));
    categories = (c.data ?? []).filter((x) => used.has(x.id));
    services = v.data ?? [];
  }
  return { settings, categories, services };
});

// อ่านเฉพาะ view products_public (ไม่มีต้นทุน/จำนวนสต็อกจริง)
export async function getProducts(f: { w?: number; a?: number; r?: number; c?: string; limit?: number }) {
  const sb = client();
  if (!sb) return { data: [] as Product[], error: "ยังไม่ได้ตั้งค่า Supabase (.env.local)" };
  let q = sb.from("products_public").select("*").order("sale_price");
  if (f.w) q = q.eq("width_mm", f.w);
  if (f.a) q = q.eq("aspect_ratio", f.a);
  if (f.r) q = q.eq("rim_inch", f.r);
  if (f.c) q = q.eq("category_id", f.c);
  if (f.limit) q = q.limit(f.limit);
  const { data, error } = await q;
  return { data: (data ?? []) as Product[], error: error ? "โหลดสินค้าไม่สำเร็จ" : null };
}
