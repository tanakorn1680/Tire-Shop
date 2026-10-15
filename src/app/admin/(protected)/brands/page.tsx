import { getAdminUser, sbServer } from "@/lib/supabase-server";
import BrandsManager from "./BrandsManager";

export default async function BrandsPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const { data } = await supabase.from("brands").select("id,name").order("name");

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ยี่ห้อ</h1>
          <p>ยี่ห้อยางที่มีขายในร้าน</p>
        </div>
      </div>
      <BrandsManager initial={data ?? []} canDelete={role === "owner"} />
    </>
  );
}
