import { getAdminUser, sbServer } from "@/lib/supabase-server";
import CategoriesManager from "./CategoriesManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const [cats, products] = await Promise.all([
    supabase.from("categories").select("id,name,sort_order,product_type").order("sort_order").order("name"),
    supabase.from("products").select("category_id"),
  ]);

  // จำนวนสินค้าที่ใช้แต่ละประเภท (ใช้บอกว่าประเภทไหนลบได้)
  const used: Record<string, number> = {};
  for (const p of (products.data ?? []) as { category_id: string | null }[]) {
    if (p.category_id) used[p.category_id] = (used[p.category_id] ?? 0) + 1;
  }
  const list = (cats.data ?? []).map((c) => ({ ...c, used: used[c.id] ?? 0 }));

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ประเภทสินค้า</h1>
          <p>ประเภทที่เพิ่มไว้จะขึ้นให้เลือกในฟอร์มสินค้า และใช้กรองสินค้า</p>
        </div>
      </div>
      {cats.error && <p className="adm-msg err">โหลดไม่สำเร็จ — ให้รัน migration 0005_category_kind.sql ใน Supabase SQL Editor ก่อน</p>}
      <CategoriesManager initial={list} canDelete={role === "owner"} />
    </>
  );
}
