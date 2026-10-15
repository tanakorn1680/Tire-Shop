import { getAdminUser, sbServer } from "@/lib/supabase-server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const { data } = await supabase
    .from("store_settings")
    .select("store_name,tagline,phone,hours,address,line_url")
    .eq("id", 1)
    .maybeSingle();

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ตั้งค่าร้าน</h1>
          <p>ข้อมูลที่ยังไม่กรอกจะถูกซ่อนจากหน้าเว็บโดยอัตโนมัติ</p>
        </div>
      </div>
      {role === "owner" ? (
        <SettingsForm initial={data ?? {}} />
      ) : (
        <div className="adm-card"><p>เฉพาะเจ้าของร้านเท่านั้นที่แก้ไขหน้านี้ได้</p></div>
      )}
    </>
  );
}
