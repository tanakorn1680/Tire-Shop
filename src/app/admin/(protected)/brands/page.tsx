import { getAdminUser, sbServer } from "@/lib/supabase-server";
import BrandsManager from "./BrandsManager";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const [brands, products] = await Promise.all([
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("products").select("brand_id"),
  ]);

  // จำนวนสินค้าที่ใช้แต่ละยี่ห้อ (ใช้บอกว่ายี่ห้อไหนลบได้)
  const used: Record<string, number> = {};
  for (const p of (products.data ?? []) as { brand_id: string }[]) used[p.brand_id] = (used[p.brand_id] ?? 0) + 1;
  const list = (brands.data ?? []).map((b) => ({ ...b, used: used[b.id] ?? 0 }));

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ยี่ห้อ</h1>
          <p>ยี่ห้อยางและล้อแม็กที่มีขายในร้าน</p>
        </div>
      </div>
      <BrandsManager initial={list} canDelete={role === "owner"} />
    </>
  );
}
