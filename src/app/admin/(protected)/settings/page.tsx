import { getAdminUser, sbServer } from "@/lib/supabase-server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const base = "store_name,tagline,phone,hours,address,line_url";
  // ถ้ายังไม่ได้รัน migration 0006 ให้โหลดคอลัมน์เดิมไปก่อน (ช่อง Facebook/Messenger จะบันทึกไม่ได้จนกว่าจะรัน)
  const full = await supabase.from("store_settings").select(`${base},facebook_url,messenger_url`).eq("id", 1).maybeSingle();
  const { data } = full.error ? await supabase.from("store_settings").select(base).eq("id", 1).maybeSingle() : full;
  const needMigration = !!full.error;
  // รูปร้าน: ถ้ายังไม่ได้รัน migration 0008 จะอัปโหลดรูปไม่ได้
  const photo = await supabase.from("store_settings").select("store_image_path").eq("id", 1).maybeSingle();
  const photoReady = !photo.error;
  // ลิงก์แผนที่: ถ้ายังไม่ได้รัน migration 0009 จะบันทึกลิงก์แผนที่ไม่ได้
  const map = await supabase.from("store_settings").select("map_url").eq("id", 1).maybeSingle();
  const mapReady = !map.error;
  const initial = { ...(data ?? {}), store_image_path: photo.data?.store_image_path ?? null, map_url: map.data?.map_url ?? null };

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ตั้งค่าร้าน</h1>
          <p>ข้อมูลที่ยังไม่กรอกจะถูกซ่อนจากหน้าเว็บโดยอัตโนมัติ</p>
        </div>
      </div>
      {role === "owner" ? (
        <SettingsForm initial={initial} needMigration={needMigration} photoReady={photoReady} mapReady={mapReady} />
      ) : (
        <div className="adm-card"><p>เฉพาะเจ้าของร้านเท่านั้นที่แก้ไขหน้านี้ได้</p></div>
      )}
    </>
  );
}
