"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { dateTimeText } from "@/lib/product-meta";
import { useConfirm } from "@/components/admin/Confirm";
import { ACTION_LABEL, localInputToIso, type HistoryRow } from "@/lib/stock-history";

// ISO -> ค่าในช่อง datetime-local (เวลาเครื่อง)
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// รายการประวัติ: เจ้าของร้านแก้ไข "เหตุผล/วันเวลา" และลบรายการได้ (จำนวนก่อน-หลังแก้ไม่ได้ เพราะเป็นข้อมูลที่ระบบบันทึก)
export default function HistoryList({ initial, canEdit }: { initial: HistoryRow[]; canEdit: boolean }) {
  const router = useRouter();
  const ask = useConfirm();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<HistoryRow | null>(null);
  const [reason, setReason] = useState("");
  const [at, setAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function openEdit(h: HistoryRow) {
    setEditing(h);
    setReason(h.reason ?? "");
    setAt(isoToLocalInput(h.occurred_at));
    setErr(null);
  }

  async function save() {
    if (!editing) return;
    const iso = localInputToIso(at);
    if (!iso) return setErr("วันที่และเวลาไม่ถูกต้อง");
    setBusy(true);
    const { data, error } = await sb()
      .from("stock_history")
      .update({ reason: reason.trim() || null, occurred_at: iso })
      .eq("id", editing.id)
      .select("id");
    setBusy(false);
    if (error || !data || data.length === 0) return setErr("แก้ไขไม่สำเร็จ (ต้องเป็นเจ้าของร้าน และรัน migration 0012_history_edit_sales.sql แล้ว)");
    const id = editing.id;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, reason: reason.trim() || null, occurred_at: iso } : x)));
    setEditing(null);
    router.refresh();
  }

  async function remove(h: HistoryRow) {
    const ok = await ask({
      title: "ลบประวัติรายการนี้?",
      message: `ลบประวัติของ ${h.product_name} (${ACTION_LABEL[h.action]}) ใช่หรือไม่? ลบแล้วกู้คืนไม่ได้ และจำนวนสินค้าในสต็อกจะไม่เปลี่ยน`,
      danger: true,
    });
    if (!ok) return;
    const { data, error } = await sb().from("stock_history").delete().eq("id", h.id).select("id");
    if (error || !data || data.length === 0) return setErr("ลบไม่สำเร็จ (ต้องเป็นเจ้าของร้าน และรัน migration 0012_history_edit_sales.sql แล้ว)");
    setErr(null);
    setItems((xs) => xs.filter((x) => x.id !== h.id));
    router.refresh();
  }

  return (
    <>
      {err && !editing && <p className="adm-msg err" style={{ marginBottom: 12 }}>{err}</p>}
      <div className="adm-list adm-hist">
        {items.map((h) => {
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
              {canEdit && (
                <div className="adm-row-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(h)}>แก้ไข</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(h)}>ลบ</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="adm-dlg-back">
          <div className="adm-dlg adm-dlg-note" role="dialog" aria-modal="true" aria-labelledby="adm-he-t">
            <h2 id="adm-he-t">แก้ไขประวัติ</h2>
            <p>{editing.product_name} · {ACTION_LABEL[editing.action]}</p>
            <label className="adm-f">เหตุผล
              <input value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} placeholder="พิมพ์เหตุผล" autoFocus />
            </label>
            <label className="adm-f">วันที่และเวลา
              <input type="datetime-local" value={at} onChange={(e) => { setAt(e.target.value); setErr(null); }} />
            </label>
            {err && <p className="adm-msg err" style={{ marginTop: 12, fontSize: 13 }}>{err}</p>}
            <div className="adm-dlg-acts">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setEditing(null)}>ยกเลิก</button>
              <button type="button" className="btn btn-dark" disabled={busy} onClick={save}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
