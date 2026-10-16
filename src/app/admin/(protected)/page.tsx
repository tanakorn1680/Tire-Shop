import Link from "next/link";
import AddProductHome from "./AddProductHome";
import SetupCard from "@/components/admin/SetupCard";
import { getAdminUser, sbServer } from "@/lib/supabase-server";
import { baht, guessKind, typeLabel, typeUnit, type Category, type ProductType } from "@/lib/product-meta";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; product_type: ProductType; category_id: string | null; is_active: boolean; is_individual: boolean;
  stock_qty: number; low_stock_threshold: number; cost_price: number; brands: { name: string } | null;
};

export default async function AdminHome() {
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const [products, brands, categories] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,product_type,category_id,is_active,is_individual,stock_qty,low_stock_threshold,cost_price,brands(name)")
      .returns<Row[]>(),
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("categories").select("id,name,product_type").order("sort_order").order("name").returns<Category[]>(),
  ]);

  if (products.error) {
    return (
      <>
        <div className="adm-pg-hd"><div><h1>หน้าหลัก</h1></div></div>
        <p className="adm-msg err">
          โหลดข้อมูลไม่สำเร็จ — ถ้าเพิ่งอัปเดตโค้ด ให้รัน migration 0004_product_types.sql ใน Supabase SQL Editor ก่อน
        </p>
      </>
    );
  }

  // ความคืบหน้าการตั้งค่าร้าน (เฉพาะเจ้าของร้าน): นับครบทุกช่องในหน้า "ตั้งค่าร้าน" (9 ช่อง) เรียงตามหน้าตั้งค่า
  // ดึงแยกกลุ่มคอลัมน์ ถ้ากลุ่มไหนยังไม่ได้รัน migration (คอลัมน์ยังไม่มี) ช่องนั้นนับเป็นยังไม่กรอก
  let setupSteps: { label: string; done: boolean }[] = [];
  if (role === "owner") {
    const q = (cols: string) => supabase.from("store_settings").select(cols).eq("id", 1).maybeSingle();
    const parts = await Promise.all([
      q("store_name,phone,hours,address,line_url"),
      q("facebook_url,messenger_url"),
      q("map_url"),
      q("store_image_path"),
    ]);
    const st: Record<string, string | null> = Object.assign(
      {},
      ...parts.map((r) => (r.error ? {} : ((r.data as unknown as Record<string, string | null> | null) ?? {}))),
    );
    const has = (k: string) => !!st[k]?.trim();
    setupSteps = [
      { label: "ชื่อร้าน", done: has("store_name") },
      { label: "เบอร์โทร", done: has("phone") },
      { label: "เวลาเปิด-ปิด", done: has("hours") },
      { label: "ที่อยู่", done: has("address") },
      { label: "ลิงก์แผนที่", done: has("map_url") },
      { label: "ลิงก์ LINE", done: has("line_url") },
      { label: "ลิงก์ Facebook", done: has("facebook_url") },
      { label: "ลิงก์ Messenger (จำเป็น)", done: has("messenger_url") },
      { label: "รูปร้านค้า", done: has("store_image_path") },
    ];
  }

  const rows = products.data ?? [];
  // การ์ดสรุปตามประเภทสินค้าที่แอดมินเพิ่มไว้ (แสดงเฉพาะประเภทที่มีสินค้า)
  const cats = categories.data ?? [];
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name;
  const kindOf = (c: Category): ProductType => guessKind(c.name) ?? c.product_type;
  const COLOR: Record<ProductType, string> = { new_tire: "c-blue", used_tire: "c-green", wheel: "c-purple" };
  const catCards = cats
    .map((c) => {
      const mine = rows.filter((r) => r.category_id === c.id);
      return { c, count: mine.length, qty: mine.reduce((n, r) => n + r.stock_qty, 0) };
    })
    .filter((x) => x.count > 0);
  const stockValue = rows.reduce((n, r) => n + r.stock_qty * Number(r.cost_price), 0);
  const low = rows
    .filter((r) => r.is_active && !r.is_individual && r.stock_qty <= r.low_stock_threshold)
    .sort((a, b) => a.stock_qty - b.stock_qty);

  return (
    <AddProductHome brands={brands.data ?? []} categories={categories.data ?? []} canDelete={role === "owner"}>

      {setupSteps.length > 0 && <SetupCard steps={setupSteps} />}

      {rows.length === 0 && <p className="adm-sub">ยังไม่มีสินค้า กดปุ่ม "+ เพิ่มสินค้า" ได้เลย (พิมพ์ยี่ห้อใหม่ในฟอร์มได้ ระบบเพิ่มให้เอง)</p>}

      {rows.length > 0 && (
        <div className="adm-stats">
          {catCards.map(({ c, qty }) => (
            <Link key={c.id} href={`/admin/products?cat=${c.id}`} className={`adm-stat ${COLOR[kindOf(c)]}`}>
              <small>{c.name}</small>
              <b>{qty.toLocaleString("th-TH")}<span>{typeUnit(kindOf(c))}</span></b>
              <em>ดูสินค้า →</em>
            </Link>
          ))}
          <Link href="/admin/products" className="adm-stat c-orange">
            <small>สินค้าทุกประเภท</small>
            <b>{rows.length.toLocaleString("th-TH")}<span>รายการ</span></b>
            <em>มูลค่าสินค้าในร้าน ฿{baht(stockValue)}</em>
          </Link>
        </div>
      )}

      {rows.length > 0 && (
      <div className="adm-panel"><h2>สินค้าใกล้หมด{low.length > 0 ? ` (${low.length})` : ""}</h2>
      {low.length === 0 ? (
        <p className="adm-sub">ไม่มีสินค้าใกล้หมด</p>
      ) : (
        <div className="adm-list">
          {low.slice(0, 10).map((r) => (
            <Link key={r.id} href={r.category_id ? `/admin/products?cat=${r.category_id}` : "/admin/products"} className="adm-row">
              <div className="adm-row-main">
                <b>{r.brands?.name} {r.name}</b>
                <small>{catName(r.category_id) ?? typeLabel(r.product_type)}</small>
              </div>
              <span className="adm-row-tag off">เหลือ {r.stock_qty} {typeUnit(r.product_type)}</span>
            </Link>
          ))}
          {low.length > 10 && <Link href="/admin/products" className="adm-sub">ดูทั้งหมดที่สินค้าและสต็อก ({low.length} รายการ)</Link>}
        </div>
      )}
      </div>
      )}
    </AddProductHome>
  );
}
