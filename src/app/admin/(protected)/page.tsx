import Link from "next/link";
import { sbServer } from "@/lib/supabase-server";
import { PRODUCT_TYPES, baht, typeLabel, typeUnit, type ProductType } from "@/lib/product-meta";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; product_type: ProductType; is_active: boolean; is_individual: boolean;
  stock_qty: number; low_stock_threshold: number; cost_price: number; brands: { name: string } | null;
};

export default async function AdminHome() {
  const supabase = await sbServer();
  const [products, brands] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,product_type,is_active,is_individual,stock_qty,low_stock_threshold,cost_price,brands(name)")
      .returns<Row[]>(),
    supabase.from("brands").select("id", { count: "exact", head: true }),
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

  const rows = products.data ?? [];
  const qtyByType = (t: ProductType) => rows.filter((r) => r.product_type === t).reduce((n, r) => n + r.stock_qty, 0);
  const stockValue = rows.reduce((n, r) => n + r.stock_qty * Number(r.cost_price), 0);
  const low = rows
    .filter((r) => r.is_active && !r.is_individual && r.stock_qty <= r.low_stock_threshold)
    .sort((a, b) => a.stock_qty - b.stock_qty);

  // ยังไม่มีสินค้า = แสดงบทเริ่มต้นใช้งาน ขั้นตอนปรับตามที่ทำไปแล้ว (มียี่ห้อหรือยัง)
  const needsSetup = rows.length === 0;
  const brandCount = brands.count ?? 0;
  const hasBrand = brandCount > 0;

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>หน้าหลัก</h1>
          <p>ภาพรวมสินค้าและสต็อกของร้าน</p>
        </div>
      </div>

      {needsSetup && (
        <div className="adm-card adm-start">
          <h2>เริ่มต้นใช้งาน</h2>
          <p className="adm-sub" style={{ margin: "4px 0 12px" }}>
            {hasBrand ? `มี ${brandCount.toLocaleString("th-TH")} ยี่ห้อแล้ว ขั้นต่อไปคือเพิ่มสินค้า` : "ยังไม่มียี่ห้อและสินค้าในระบบ ทำตาม 2 ขั้นตอนนี้ได้เลย"}
          </p>
          <ol className="adm-steps">
            <li className={hasBrand ? "done" : ""}>
              <b>{hasBrand ? "เพิ่มยี่ห้อแล้ว" : "เพิ่มยี่ห้อ"}</b>
              <span>
                {hasBrand
                  ? "เพิ่มยี่ห้ออื่นหรือแก้ชื่อได้ที่หน้ายี่ห้อ"
                  : "เช่น Michelin, Bridgestone เพิ่มได้ทีละหลายยี่ห้อ"}
              </span>
            </li>
            <li>
              <b>เพิ่มสินค้า</b>
              <span>เลือกประเภท ยางมือหนึ่ง ยางมือสอง หรือ ล้อแม็ก แล้วกรอกยี่ห้อ รุ่น ขนาด ราคา และจำนวน รายละเอียดอื่นกรอกทีหลังได้</span>
            </li>
          </ol>
          <div className="adm-start-acts">
            {hasBrand ? (
              <>
                <Link href="/admin/products" className="btn btn-dark">เพิ่มสินค้า</Link>
                <Link href="/admin/brands" className="btn btn-ghost">จัดการยี่ห้อ</Link>
              </>
            ) : (
              <>
                <Link href="/admin/brands" className="btn btn-dark">เพิ่มยี่ห้อ</Link>
                <Link href="/admin/products" className="btn btn-ghost">ข้ามไปเพิ่มสินค้าเลย</Link>
              </>
            )}
          </div>
          {!hasBrand && <p className="adm-hint" style={{ marginTop: 10 }}>ถ้าข้ามขั้นตอนยี่ห้อ พิมพ์ชื่อยี่ห้อในฟอร์มสินค้าได้เลย ระบบจะเพิ่มยี่ห้อให้เอง</p>}
        </div>
      )}

      {rows.length > 0 && (
        <div className="adm-stats">
          {PRODUCT_TYPES.map((t, i) =>
            rows.some((r) => r.product_type === t.value) ? (
              <Link key={t.value} href={`/admin/products?type=${t.value}`} className={`adm-stat ${["c-blue", "c-green", "c-purple"][i]}`}>
                <small>{t.label}</small>
                <b>{qtyByType(t.value).toLocaleString("th-TH")}<span>{t.unit}</span></b>
                <em>ดูรายละเอียด →</em>
              </Link>
            ) : null,
          )}
          <Link href="/admin/products" className="adm-stat c-orange">
            <small>สินค้าทั้งหมด</small>
            <b>{rows.length.toLocaleString("th-TH")}<span>รายการ</span></b>
            <em>มูลค่าสต็อก ฿{baht(stockValue)}</em>
          </Link>
        </div>
      )}

      {rows.length > 0 && (
      <div className="adm-panel"><h2>สต็อกใกล้หมด{low.length > 0 ? ` (${low.length})` : ""}</h2>
      {low.length === 0 ? (
        <p className="adm-sub">ไม่มีสินค้าใกล้หมด</p>
      ) : (
        <div className="adm-list">
          {low.slice(0, 10).map((r) => (
            <Link key={r.id} href={`/admin/products?type=${r.product_type}`} className="adm-row">
              <div className="adm-row-main">
                <b>{r.brands?.name} {r.name}</b>
                <small>{typeLabel(r.product_type)}</small>
              </div>
              <span className="adm-row-tag off">เหลือ {r.stock_qty} {typeUnit(r.product_type)}</span>
            </Link>
          ))}
          {low.length > 10 && <Link href="/admin/products" className="adm-sub">ดูทั้งหมดที่สินค้าและสต็อก ({low.length} รายการ)</Link>}
        </div>
      )}
      </div>
      )}
    </>
  );
}
