import Link from "next/link";
import { sbServer } from "@/lib/supabase-server";

export default async function AdminHome() {
  const supabase = await sbServer();
  const [settings, categories, services, brands, products] = await Promise.all([
    supabase.from("store_settings").select("store_name").eq("id", 1).maybeSingle(),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  const storeName = settings.data?.store_name?.trim();

  const cards = [
    { href: "/admin/settings", label: "ตั้งค่าร้าน", value: storeName || "ยังไม่ได้ตั้งชื่อร้าน" },
    { href: "/admin/categories", label: "ประเภทสินค้า", value: `${categories.count ?? 0} รายการ` },
    { href: "/admin/services", label: "บริการ", value: `${services.count ?? 0} รายการ` },
    { href: "/admin/brands", label: "ยี่ห้อ", value: `${brands.count ?? 0} รายการ` },
    { href: "/admin/products", label: "สินค้า", value: `${products.count ?? 0} รายการ` },
  ];

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ภาพรวม</h1>
          <p>จัดการข้อมูลร้านของคุณ</p>
        </div>
      </div>
      <div className="adm-list">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="adm-row">
            <div className="adm-row-main">
              <b>{c.label}</b>
              <small>{c.value}</small>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
