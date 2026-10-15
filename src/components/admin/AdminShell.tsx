"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

const NAV = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/settings", label: "ตั้งค่าร้าน" },
  { href: "/admin/categories", label: "ประเภทสินค้า" },
  { href: "/admin/services", label: "บริการ" },
  { href: "/admin/brands", label: "ยี่ห้อ" },
  { href: "/admin/products", label: "สินค้า" },
];

export default function AdminShell({
  role,
  children,
}: {
  role: "owner" | "staff";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await sb().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="adm">
      <header className="adm-hdr">
        <div className="adm-hdr-in">
          <span className="adm-brand">จัดการร้าน</span>
          <details className="adm-nav-m">
            <summary aria-label="เมนู">เมนู</summary>
            <div>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={pathname === n.href ? "on" : ""}>
                  {n.label}
                </Link>
              ))}
              <button type="button" onClick={signOut}>ออกจากระบบ</button>
            </div>
          </details>
          <nav className="adm-nav-d">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={pathname === n.href ? "on" : ""}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="adm-hdr-r">
            <span className="adm-role">{role === "owner" ? "เจ้าของร้าน" : "พนักงาน"}</span>
            <button type="button" className="adm-signout" onClick={signOut}>ออกจากระบบ</button>
          </div>
        </div>
      </header>
      <main className="adm-main">{children}</main>
    </div>
  );
}
