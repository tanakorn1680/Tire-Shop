import { getAdminUser, sbServer } from "@/lib/supabase-server";
import CarsManager, { type CarRow } from "./CarsManager";

export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("car_fitments")
    .select("id,brand,model,variant,sizes")
    .order("brand")
    .order("model")
    .order("variant")
    .returns<CarRow[]>();

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>รุ่นรถ</h1>
          <p>ขนาดยางที่ใช้ได้ของแต่ละรุ่นรถ ใช้ในช่อง "ค้นหาจากรุ่นรถ" หน้าเว็บลูกค้า</p>
        </div>
      </div>
      {error ? (
        <p className="adm-msg err">โหลดข้อมูลไม่สำเร็จ — ให้รัน migration 0014_car_fitments.sql ใน Supabase SQL Editor ก่อน</p>
      ) : (
        <CarsManager initial={data ?? []} canDelete={role === "owner"} />
      )}
    </>
  );
}
