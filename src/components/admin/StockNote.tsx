"use client";

import { useRef, useState } from "react";
import { useConfirm } from "./Confirm";
import { ACTION_LABEL, localInputToIso, nowLocalInput, type HistoryAction } from "@/lib/stock-history";

// หน้าต่างกรอกเหตุผล + วันเวลา ก่อนเปลี่ยนจำนวน/ลบสินค้า (เลือกไม่บันทึกประวัติได้ แต่จะถามยืนยันอีกครั้ง)
export type NoteOpts = { action: Exclude<HistoryAction, "add">; message: string; confirmText?: string; danger?: boolean };
export type NoteResult = { record: boolean; reason: string; at: string };

const CHIPS: Record<NoteOpts["action"], string[]> = {
  increase: ["รับสินค้าเข้า", "ลูกค้าคืนสินค้า"],
  decrease: ["ขายแล้ว", "ชำรุด / เสียหาย"],
  delete: ["ขายแล้ว", "ชำรุด / เสียหาย"],
};
const LABEL: Record<NoteOpts["action"], string> = {
  increase: "ได้มาจากไหน / เหตุผลที่เพิ่ม",
  decrease: "เหตุผลที่ลด (ขายหรือเหตุอื่น)",
  delete: "เหตุผลที่ลบ (ขายหรือเหตุอื่น)",
};

export function useStockNote() {
  const [opts, setOpts] = useState<NoteOpts | null>(null);
  const resolver = useRef<((r: NoteResult | null) => void) | null>(null);
  const askNote = (o: NoteOpts) =>
    new Promise<NoteResult | null>((resolve) => {
      resolver.current?.(null);
      resolver.current = resolve;
      setOpts(o);
    });
  const done = (r: NoteResult | null) => {
    resolver.current?.(r);
    resolver.current = null;
    setOpts(null);
  };
  return { askNote, noteDialog: opts ? <NoteDialog key={opts.message} opts={opts} onDone={done} /> : null };
}

function NoteDialog({ opts, onDone }: { opts: NoteOpts; onDone: (r: NoteResult | null) => void }) {
  const ask = useConfirm();
  const [reason, setReason] = useState("");
  const [at, setAt] = useState(nowLocalInput);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    const iso = localInputToIso(at);
    if (!iso) return setErr("วันที่และเวลาไม่ถูกต้อง");
    if (!reason.trim()) return setErr("กรุณาพิมพ์เหตุผล หรือกด \"ไม่บันทึกลงประวัติ\"");
    onDone({ record: true, reason: reason.trim(), at: iso });
  }

  async function skip() {
    const ok = await ask({
      title: "ไม่บันทึกลงประวัติ?",
      message: "แน่ใจหรือไม่ว่าไม่ต้องการบันทึกเหตุผลลงประวัติ? รายการนี้จะไม่ปรากฏในประวัติสต็อก",
      confirmText: "แน่ใจ ไม่บันทึก",
    });
    if (ok) onDone({ record: false, reason: "", at: "" });
  }

  return (
    <div className="adm-dlg-back">
      <div className="adm-dlg adm-dlg-note" role="dialog" aria-modal="true" aria-labelledby="adm-note-t">
        <h2 id="adm-note-t">{ACTION_LABEL[opts.action]}</h2>
        <p>{opts.message}</p>
        <label className="adm-f">{LABEL[opts.action]}
          <input value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} placeholder="พิมพ์เหตุผล" autoFocus />
        </label>
        <div className="adm-chips">
          {CHIPS[opts.action].map((c) => (
            <button key={c} type="button" className="adm-chip" onClick={() => { setReason(c); setErr(null); }}>{c}</button>
          ))}
        </div>
        <label className="adm-f">วันที่และเวลา
          <input type="datetime-local" value={at} onChange={(e) => { setAt(e.target.value); setErr(null); }} />
        </label>
        {err && <p className="adm-msg err" style={{ marginTop: 12, fontSize: 13 }}>{err}</p>}
        <div className="adm-dlg-acts">
          <button type="button" className="btn btn-ghost" onClick={() => onDone(null)}>ยกเลิก</button>
          <button type="button" className={`btn ${opts.danger ? "btn-danger-solid" : "btn-dark"}`} onClick={save}>{opts.confirmText ?? "บันทึก"}</button>
        </div>
        <button type="button" className="adm-dlg-skip" onClick={skip}>ไม่บันทึกลงประวัติ</button>
      </div>
    </div>
  );
}
