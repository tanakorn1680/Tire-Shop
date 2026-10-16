import { sbServer } from "@/lib/supabase-server";
import { dateTimeText } from "@/lib/product-meta";
import { ACTION_LABEL, type HistoryRow } from "@/lib/stock-history";

export const dynamic = "force-dynamic";

const LIMIT = 300;

// ประวัติสต็อก: เพิ่มสินค้าใหม่ / เพิ่ม-ลดจำนวน / ลบสินค้า พร้อมเหตุผลที่แอดมินพิมพ์ไว้ (ดูอย่างเดียว แก้ไขไม่ได้)
export default async function HistoryPage() {
  const supabase = await sbServer();
  const { data, error } = await supabase
    .from("stock_history")
    .select("id,occurred_at,action,product_name,qty_before,qty_after,qty_change,reason")
    .order("occurred_at", { ascending: false })
    .limit(LIMIT)
    .returns<HistoryRow[]>();

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ประวัติสต็อก</h1>
          <p>การเพิ่มสินค้า เพิ่ม-ลดจำนวน และลบสินค้า เรียงจากใหม่ไปเก่า</p>
        </div>
      </div>
      {error ? (
        <p className="adm-msg err">โหลดประวัติไม่สำเร็จ — ถ้าเพิ่งอัปเดตโค้ด ให้รัน migration 0011_stock_history.sql ใน Supabase SQL Editor ก่อน</p>
      ) : !data || data.length === 0 ? (
        <p className="adm-empty">ยังไม่มีประวัติ</p>
      ) : (
        <div className="adm-list adm-hist">
          {data.map((h) => {
            const ch = h.qty_change;
            return (
              <div className="adm-row" key={h.id}>
                <div className="adm-row-main">
                  <b>{h.product_name}</b>
                  <small>{h.reason || "ไม่ได้ระบุเหตุผล"}</small>
                  <small>{dateTimeText(h.occurred_at)}</small>
                </div>
                <span className={`adm-row-tag ${h.action === "add" || h.action === "increase" ? "" : "off"}`}>{ACTION_LABEL[h.action]}</span>
                {ch !== null && (
                  <span className={`adm-hist-q ${ch > 0 ? "up" : ch < 0 ? "down" : ""}`}>
                    {h.qty_before} → {h.qty_after} ({ch > 0 ? "+" : ""}{ch})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {data && data.length >= LIMIT && <p className="adm-sub" style={{ marginTop: 12 }}>แสดง {LIMIT} รายการล่าสุด</p>}
    </>
  );
}
