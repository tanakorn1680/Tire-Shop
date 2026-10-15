import { getAdminUser, sbServer } from "@/lib/supabase-server";
import CategoriesManager from "./CategoriesManager";

export default async function CategoriesPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,sort_order,product_type")
    .order("sort_order")
    .order("name");

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ประเภทสินค้า</h1>
          <p>ประเภทที่เพิ่มไว้จะขึ้นให้เลือกในฟอร์มสินค้า และใช้กรองสินค้าในหน้าเว็บลูกค้า</p>
        </div>
      </div>
      {error && <p className="adm-msg err">โหลดไม่สำเร็จ — ให้รัน migration 0005_category_kind.sql ใน Supabase SQL Editor ก่อน</p>}
      <CategoriesManager initial={data ?? []} canDelete={role === "owner"} />
    </>
  );
}
