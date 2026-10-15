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
  const products = await supabase
    .from("products")
    .select("id,name,product_type,is_active,is_individual,stock_qty,low_stock_threshold,cost_price,brands(name)")
    .returns<Row[]>();

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

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>หน้าหลัก</h1>
          <p>ภาพรวมสินค้าและสต็อกของร้าน</p>
        </div>
        <Link href="/admin/products?add=1" className="btn btn-dark">+ เพิ่มสินค้า</Link>
      </div>

      {rows.length === 0 && <p className="adm-sub">ยังไม่มีสินค้า กดปุ่ม "+ เพิ่มสินค้า" ได้เลย (พิมพ์ยี่ห้อใหม่ในฟอร์มได้ ระบบเพิ่มให้เอง)</p>}

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
