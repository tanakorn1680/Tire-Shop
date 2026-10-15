import { getAdminUser, sbServer } from "@/lib/supabase-server";
import CategoriesManager from "./CategoriesManager";

export default async function CategoriesPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const { data } = await supabase
    .from("categories")
    .select("id,name,sort_order")
    .order("sort_order")
    .order("name");

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ประเภทสินค้า</h1>
          <p>ใช้สำหรับกรองสินค้าในหน้าเว็บ</p>
        </div>
      </div>
      <CategoriesManager initial={data ?? []} canDelete={role === "owner"} />
    </>
  );
}
