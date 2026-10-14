import { createClient } from "@supabase/supabase-js";

export type Product = {
  id: string; brand_name: string; name: string; model: string | null;
  size_label: string; load_index: string | null; speed_rating: string | null;
  sale_price: number; in_stock: boolean; image_path: string | null;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const imageUrl = (path?: string | null) =>
  path && url ? `${url}/storage/v1/object/public/product-images/${path}` : null;

// อ่านเฉพาะ view products_public (ไม่มีต้นทุน/จำนวนสต็อกจริง)
export async function getProducts(f: { w?: number; a?: number; r?: number; limit?: number }) {
  if (!url || !key) return { data: [] as Product[], error: "ยังไม่ได้ตั้งค่า Supabase (.env.local)" };
  let q = createClient(url, key).from("products_public").select("*").order("sale_price");
  if (f.w) q = q.eq("width_mm", f.w);
  if (f.a) q = q.eq("aspect_ratio", f.a);
  if (f.r) q = q.eq("rim_inch", f.r);
  if (f.limit) q = q.limit(f.limit);
  const { data, error } = await q;
  return { data: (data ?? []) as Product[], error: error ? "โหลดสินค้าไม่สำเร็จ" : null };
}
