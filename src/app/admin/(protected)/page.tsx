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

  const needsSetup = (brands.count ?? 0) === 0 || rows.length === 0;

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>หน้าหลัก</h1>
          <p>ภาพรวมสินค้าและสต็อกของร้าน</p>
        </div>
      </div>

      {needsSetup && (
        <div className="adm-card" style={{ marginBottom: 16 }}>
          <b>เริ่มต้นใช้งาน</b>
          <p className="adm-sub" style={{ margin: "6px 0 0" }}>
            {(brands.count ?? 0) === 0 ? (
              <>เริ่มจากเพิ่ม <Link href="/admin/brands" style={{ textDecoration: "underline" }}>ยี่ห้อ</Link> แล้วจึงเพิ่มสินค้า</>
            ) : (
              <>เพิ่มสินค้าชิ้นแรกได้ที่ <Link href="/admin/products" style={{ textDecoration: "underline" }}>สินค้าและสต็อก</Link></>
            )}
          </p>
        </div>
      )}

      <div className="adm-stats">
        {PRODUCT_TYPES.map((t) => (
          <Link key={t.value} href={`/admin/products?type=${t.value}`} className="adm-stat">
            <small>{t.label}</small>
            <b>{qtyByType(t.value).toLocaleString("th-TH")}<span>{t.unit}</span></b>
          </Link>
        ))}
        <div className="adm-stat">
          <small>มูลค่าสต็อก (ราคาทุน)</small>
          <b>฿{baht(stockValue)}</b>
        </div>
      </div>

      <h2 className="adm-sec-t">สต็อกใกล้หมด{low.length > 0 ? ` (${low.length})` : ""}</h2>
      {low.length === 0 ? (
        <p className="adm-empty">ไม่มีสินค้าใกล้หมด</p>
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
    </>
  );
}
