import { getAdminUser, sbServer } from "@/lib/supabase-server";
import { type HistoryRow } from "@/lib/stock-history";
import HistoryList from "./HistoryList";

export const dynamic = "force-dynamic";

const LIMIT = 300;
const TOP = 10;

type SalesRow = {
  product_name: string; qty: number; times: number; total_qty: number; total_times: number; total_products: number;
};

const num = (n: number) => n.toLocaleString("th-TH");

// เดือนปัจจุบันตามเวลาไทย รูปแบบ YYYY-MM
const bangkokMonth = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 7);

// ประวัติสต็อก + สรุปสินค้าขายดี (ทั้งเดือนที่เลือก และตลอดมา) เจ้าของร้านแก้ไข/ลบประวัติได้
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const month = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : bangkokMonth();
  const [y, mo] = month.split("-").map(Number);
  const from = new Date(`${month}-01T00:00:00+07:00`).toISOString();
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  const to = new Date(`${next}-01T00:00:00+07:00`).toISOString();
  const monthLabel = new Date(`${month}-15T12:00:00+07:00`).toLocaleDateString("th-TH", { month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const [list, mon, all] = await Promise.all([
    supabase
      .from("stock_history")
      .select("id,occurred_at,action,product_name,qty_before,qty_after,qty_change,reason")
      .order("occurred_at", { ascending: false })
      .limit(LIMIT)
      .returns<HistoryRow[]>(),
    supabase.rpc("sales_by_product", { p_from: from, p_to: to, p_limit: TOP }),
    supabase.rpc("sales_by_product", { p_from: null, p_to: null, p_limit: TOP }),
  ]);

  const salesErr = !!(mon.error || all.error);
  const monRows = (mon.data ?? []) as unknown as SalesRow[];
  const allRows = (all.data ?? []) as unknown as SalesRow[];
  const sum = (rows: SalesRow[]) => ({ qty: rows[0]?.total_qty ?? 0, times: rows[0]?.total_times ?? 0, products: rows[0]?.total_products ?? 0 });
  const mSum = sum(monRows);
  const aSum = sum(allRows);

  const ranking = (title: string, rows: SalesRow[], total: ReturnType<typeof sum>) => (
    <div className="adm-panel">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="adm-sub">ยังไม่มีรายการขาย</p>
      ) : (
        <div className="adm-list">
          {rows.map((r, i) => (
            <div className="adm-row" key={r.product_name}>
              <span className={`adm-rank ${i < 3 ? "top" : ""}`}>{i + 1}</span>
              <div className="adm-row-main">
                <b>{r.product_name}</b>
                <small>ขาย {num(r.times)} ครั้ง · {total.qty > 0 ? Math.round((r.qty / total.qty) * 100) : 0}% ของยอดขายทั้งหมด</small>
                <div className="adm-bar"><i style={{ width: `${Math.max(4, Math.round((r.qty / rows[0].qty) * 100))}%` }} /></div>
              </div>
              <span className="adm-hist-q">{num(r.qty)} ชิ้น</span>
            </div>
          ))}
        </div>
      )}
      {total.products > rows.length && <p className="adm-sub" style={{ marginTop: 10 }}>แสดง {rows.length} อันดับแรก จากทั้งหมด {num(total.products)} รายการสินค้า</p>}
    </div>
  );

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>ประวัติ</h1>
          <p>สินค้าขายดี และประวัติเพิ่ม-ลดจำนวน เรียงจากใหม่ไปเก่า</p>
        </div>
      </div>

      {salesErr ? (
        <p className="adm-msg err" style={{ marginBottom: 16 }}>โหลดสรุปยอดขายไม่สำเร็จ — ให้รัน migration 0012_history_edit_sales.sql ใน Supabase SQL Editor ก่อน</p>
      ) : (
        <>
          <form method="get" className="adm-month">
            <label htmlFor="adm-m">ดูเดือน</label>
            <input id="adm-m" type="month" name="m" defaultValue={month} />
            <button type="submit" className="btn btn-ghost btn-sm">ดู</button>
          </form>

          <div className="adm-stats">
            <div className="adm-stat c-blue">
              <small>ขายเดือน {monthLabel}</small>
              <b>{num(mSum.qty)}<span>ชิ้น</span></b>
              <em>{num(mSum.times)} ครั้ง · {num(mSum.products)} รายการสินค้า</em>
            </div>
            <div className="adm-stat c-green">
              <small>ขายทั้งหมดตั้งแต่เริ่มบันทึก</small>
              <b>{num(aSum.qty)}<span>ชิ้น</span></b>
              <em>{num(aSum.times)} ครั้ง · {num(aSum.products)} รายการสินค้า</em>
            </div>
          </div>

          <div className="adm-sales">
            {ranking(`ขายดีเดือน ${monthLabel}`, monRows, mSum)}
            {ranking("ขายดีตลอดมา", allRows, aSum)}
          </div>
          <p className="adm-sub" style={{ marginTop: 10 }}>นับจากรายการลดจำนวนหรือลบสินค้าที่เหตุผลมีคำว่า &quot;ขาย&quot; (เช่น ขายแล้ว)</p>
        </>
      )}

      <h2 className="adm-sec-h">ประวัติทั้งหมด</h2>
      {list.error ? (
        <p className="adm-msg err">โหลดประวัติไม่สำเร็จ — ถ้าเพิ่งอัปเดตโค้ด ให้รัน migration 0011_stock_history.sql ใน Supabase SQL Editor ก่อน</p>
      ) : !list.data || list.data.length === 0 ? (
        <p className="adm-empty">ยังไม่มีประวัติ</p>
      ) : (
        <HistoryList initial={list.data} canEdit={role === "owner"} />
      )}
      {list.data && list.data.length >= LIMIT && <p className="adm-sub" style={{ marginTop: 12 }}>แสดง {LIMIT} รายการล่าสุด</p>}
    </>
  );
}
