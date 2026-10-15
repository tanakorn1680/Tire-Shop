import { getAdminUser, sbServer } from "@/lib/supabase-server";
import ServicesManager from "./ServicesManager";

export default async function ServicesPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const { data } = await supabase
    .from("services")
    .select("id,name,description,sort_order,is_active")
    .order("sort_order")
    .order("name");

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>บริการ</h1>
          <p>แสดงในหน้าแรก เฉพาะบริการที่เปิดใช้งาน</p>
        </div>
      </div>
      <ServicesManager initial={data ?? []} canDelete={role === "owner"} />
    </>
  );
}
