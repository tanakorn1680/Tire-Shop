"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase-browser";

// เมนูเรียงตามลำดับการใช้งานจริง เพิ่มเมนูใหม่ที่นี่เมื่อหน้านั้นพร้อมใช้งานแล้วเท่านั้น
const NAV: { group: string | null; items: { href: string; label: string }[] }[] = [
  {
    group: null,
    items: [
      { href: "/admin", label: "หน้าหลัก" },
      { href: "/admin/products", label: "สินค้าและสต็อก" },
    ],
  },
  {
    group: "ตั้งค่า",
    items: [
      { href: "/admin/settings", label: "ตั้งค่าร้าน" },
      { href: "/admin/brands", label: "ยี่ห้อ" },
      { href: "/admin/categories", label: "ประเภทสินค้า" },
      { href: "/admin/services", label: "บริการ" },
    ],
  },
];

export default function AdminShell({
  role,
  storeName,
  children,
}: {
  role: "owner" | "staff";
  storeName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ปิดเมนูมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => { setOpen(false); }, [pathname]);

  async function signOut() {
    await sb().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const isOn = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const name = storeName?.trim() || "จัดการร้าน";
  const roleLabel = role === "owner" ? "เจ้าของร้าน" : "พนักงาน";

  const navList = (
    <nav aria-label="เมนูหลัก">
      {NAV.map((g, i) => (
        <div key={i} className="adm-navg">
          {g.group && <div className="adm-grp">{g.group}</div>}
          {g.items.map((n) => (
            <Link key={n.href} href={n.href} className={isOn(n.href) ? "on" : ""} aria-current={isOn(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">{name}</div>
        {navList}
        <div className="adm-side-foot">
          <span>{roleLabel}</span>
          <button type="button" className="adm-signout" onClick={signOut}>ออกจากระบบ</button>
        </div>
      </aside>

      <div className="adm-body">
        <header className="adm-top">
          <span className="adm-brand">{name}</span>
          <button type="button" className="adm-menu-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "ปิด" : "เมนู"}
          </button>
        </header>
        {open && (
          <div className="adm-drawer">
            {navList}
            <div className="adm-side-foot">
              <span>{roleLabel}</span>
              <button type="button" className="adm-signout" onClick={signOut}>ออกจากระบบ</button>
            </div>
          </div>
        )}
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
