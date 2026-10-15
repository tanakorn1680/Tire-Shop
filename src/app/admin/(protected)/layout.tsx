import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase-server";
import AdminShell from "@/components/admin/AdminShell";

// ครอบทุกหน้าใน /admin ยกเว้น /admin/login
// ตรวจสิทธิ์จริงฝั่งเซิร์ฟเวอร์ทุกครั้งที่เรนเดอร์ (ไม่ใช่แค่ซ่อนปุ่มฝั่ง client)
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getAdminUser();

  if (!user) redirect("/admin/login");

  if (!role) {
    return (
      <div className="adm-auth">
        <div className="adm-card adm-auth-card">
          <h1>ยังไม่มีสิทธิ์เข้าใช้งาน</h1>
          <p>บัญชีนี้ยังไม่ได้รับสิทธิ์จากเจ้าของร้าน กรุณาติดต่อเจ้าของร้านเพื่อขอสิทธิ์เข้าใช้งาน</p>
        </div>
      </div>
    );
  }

  return <AdminShell role={role}>{children}</AdminShell>;
}
