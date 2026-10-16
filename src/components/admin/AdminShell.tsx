"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ไอคอนเส้นง่ายๆ (ไม่พึ่งแพ็กเกจเพิ่ม)
const ICONS: Record<string, string[]> = {
  home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  box: ["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.3 7L12 12l8.7-5M12 22V12"],
  sliders: ["M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"],
  tag: ["M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z", "M7 7h.01"],
  grid: ["M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"],
  wrench: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"],
};
const Icon = ({ n }: { n: string }) => (
  <svg className="adm-ic" viewBox="0 0 24 24" aria-hidden="true">{ICONS[n].map((d, i) => <path key={i} d={d} />)}</svg>
);
import { sb } from "@/lib/supabase-browser";
import { ConfirmProvider } from "./Confirm";

// เมนูเรียงตามลำดับการใช้งานจริง เพิ่มเมนูใหม่ที่นี่เมื่อหน้านั้นพร้อมใช้งานแล้วเท่านั้น
const NAV: { group: string | null; items: { href: string; label: string; icon: string }[] }[] = [
  {
    group: null,
    items: [
      { href: "/admin", label: "หน้าหลัก", icon: "home" },
      { href: "/admin/products", label: "สินค้าและสต็อก", icon: "box" },
    ],
  },
  {
    group: "ตั้งค่า",
    items: [
      { href: "/admin/settings", label: "ตั้งค่าร้าน", icon: "sliders" },
      { href: "/admin/brands", label: "ยี่ห้อ", icon: "tag" },
      { href: "/admin/categories", label: "ประเภทสินค้า", icon: "grid" },
      { href: "/admin/services", label: "บริการ", icon: "wrench" },
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
  const [q, setQ] = useState("");
  const [today, setToday] = useState("");

  // แสดงวันที่ฝั่ง client เท่านั้น (กัน hydration ไม่ตรงกัน)
  useEffect(() => {
    setToday(new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }));
  }, []);

  // ปิดเมนูมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
  useEffect(() => { setOpen(false); }, [pathname]);

  async function signOut() {
    await sb().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  // ย้อนกลับหน้าก่อนหน้า (ถ้าเปิดหน้านี้ตรงๆ ไม่มีประวัติ ให้ไปหน้าหลักแอดมิน)
  const goBack = () => (window.history.length > 1 ? router.back() : router.push("/admin"));

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
              <Icon n={n.icon} />{n.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="adm">
      <ConfirmProvider>
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
          <div className="adm-top-l">
            <button type="button" className="adm-back" onClick={goBack}>‹ ย้อนกลับ</button>
            <span className="adm-brand">{name}</span>
          </div>
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
        <div className="adm-tb">
          <button type="button" className="adm-back adm-back-d" onClick={goBack}>‹ ย้อนกลับ</button>
          {/* หน้าสินค้ามีช่องค้นหาของตัวเองอยู่แล้ว ไม่แสดงซ้ำ */}
          {!pathname.startsWith("/admin/products") && <form onSubmit={(e) => { e.preventDefault(); router.push(`/admin/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาสินค้า / ยี่ห้อ / รุ่น / ขนาด ..." />
          </form>}
          <span className="adm-date">{today}</span>
        </div>
        <main className="adm-main">{children}</main>
      </div>
      </ConfirmProvider>
    </div>
  );
}
