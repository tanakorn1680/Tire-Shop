"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useConfirm } from "@/components/admin/Confirm";

export type CarRow = { id: string; brand: string; model: string; variant: string; sizes: string[] };

const clean = (s: string) => s.trim().replace(/\s+/g, " ");
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// "185/60R15, 185/55 r16" -> ["185/60R15","185/55R16"]  ขนาดที่เขียนผิดรูปแบบจะคืนเป็น bad
function parseSizes(text: string): { sizes: string[]; bad: string | null } {
  const sizes: string[] = [];
  for (const raw of text.split(/[,;\n]+/)) {
    const t = raw.trim();
    if (!t) continue;
    const m = /^(\d{3})\s*\/\s*(\d{2})\s*(?:Z?R)\s*(\d{2})$/i.exec(t);
    if (!m) return { sizes, bad: t };
    const s = `${m[1]}/${m[2]}R${m[3]}`;
    if (!sizes.includes(s)) sizes.push(s);
  }
  return { sizes, bad: null };
}

const EMPTY = { brand: "", model: "", variant: "", sizes: "" };

export default function CarsManager({ initial, canDelete }: { initial: CarRow[]; canDelete: boolean }) {
  const router = useRouter();
  const ask = useConfirm();
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof EMPTY, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErr(null); };

  const brands = Array.from(new Set(items.map((c) => c.brand)));
  const models = Array.from(new Set(items.filter((c) => same(c.brand, clean(form.brand))).map((c) => c.model)));
  const sortItems = (xs: CarRow[]) =>
    [...xs].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model) || a.variant.localeCompare(b.variant));

  function startEdit(c: CarRow) {
    setEditId(c.id);
    setForm({ brand: c.brand, model: c.model, variant: c.variant, sizes: c.sizes.join(", ") });
    setErr(null);
    window.scrollTo(0, 0);
  }
  function reset() { setEditId(null); setForm(EMPTY); setErr(null); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const brand = clean(form.brand), model = clean(form.model), variant = clean(form.variant);
    if (!brand || !model) return setErr("กรุณากรอกยี่ห้อรถและรุ่นรถ");
    const { sizes, bad } = parseSizes(form.sizes);
    if (bad) return setErr(`ขนาดยาง "${bad}" ไม่ถูกต้อง เขียนเช่น 185/60R15`);
    if (sizes.length === 0) return setErr("กรุณากรอกขนาดยางอย่างน้อย 1 ขนาด เช่น 185/60R15");
    setBusy(true);
    const row = { brand, model, variant, sizes };
    const q = editId
      ? sb().from("car_fitments").update(row).eq("id", editId).select("id,brand,model,variant,sizes").single()
      : sb().from("car_fitments").insert(row).select("id,brand,model,variant,sizes").single();
    const { data, error } = await q;
    setBusy(false);
    if (error || !data) {
      setErr(error?.code === "23505" ? "มีรุ่นรถ ปี/รุ่นย่อยนี้อยู่แล้ว กดแก้ไขที่รายการเดิมแทน" : "บันทึกไม่สำเร็จ (ตรวจว่าได้รัน migration 0014_car_fitments.sql แล้ว)");
      return;
    }
    const saved = data as CarRow;
    setItems((xs) => sortItems(editId ? xs.map((x) => (x.id === editId ? saved : x)) : [...xs, saved]));
    // เพิ่มรุ่นถัดไปของรถคันเดียวกันได้ต่อเนื่อง: คงยี่ห้อ/รุ่นไว้ ล้างปีและขนาด
    if (editId) reset(); else setForm({ brand, model, variant: "", sizes: "" });
    router.refresh();
  }

  async function remove(c: CarRow) {
    if (!(await ask({ message: `ลบ ${c.brand} ${c.model}${c.variant ? ` (${c.variant})` : ""} ใช่หรือไม่?`, danger: true }))) return;
    setBusy(true);
    const { data, error } = await sb().from("car_fitments").delete().eq("id", c.id).select("id");
    setBusy(false);
    if (error || !data || data.length === 0) return setErr("ลบไม่สำเร็จ");
    setItems((xs) => xs.filter((x) => x.id !== c.id));
    if (editId === c.id) reset();
    router.refresh();
  }

  return (
    <>
      <form className="adm-card adm-form" onSubmit={save} style={{ marginBottom: 16 }}>
        <div className="adm-f-row">
          <label className="adm-f">ยี่ห้อรถ *
            <input list="car-brands" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="เช่น Toyota" autoComplete="off" />
          </label>
          <label className="adm-f">รุ่นรถ *
            <input list="car-models" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="เช่น Vios" autoComplete="off" />
          </label>
        </div>
        <label className="adm-f">ปีรถ / รุ่นย่อย
          <input value={form.variant} onChange={(e) => set("variant", e.target.value)} placeholder="เช่น 2013-2022 1.5 J" autoComplete="off" />
        </label>
        <label className="adm-f">ขนาดยางที่ใช้ได้ *
          <input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="เช่น 185/60R15, 185/55R16" autoComplete="off" />
          <span className="adm-hint">ใส่ได้หลายขนาด คั่นด้วยเครื่องหมายจุลภาค (,)</span>
        </label>
        <datalist id="car-brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
        <datalist id="car-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
        {err && <p className="adm-msg err">{err}</p>}
        <div className="adm-actions">
          {editId && <button className="btn btn-ghost" type="button" onClick={reset} disabled={busy}>ยกเลิก</button>}
          <button className="btn btn-dark" type="submit" disabled={busy}>{busy ? "กำลังบันทึก…" : editId ? "บันทึกการแก้ไข" : "เพิ่มรุ่นรถ"}</button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="adm-empty">
          <p>ยังไม่มีข้อมูลรุ่นรถ</p>
          <p style={{ marginTop: 8 }}>เพิ่มอย่างน้อย 1 รายการ ช่อง "ค้นหาจากรุ่นรถ" จะขึ้นที่หน้าเว็บลูกค้าเอง</p>
        </div>
      ) : (
        <div className="adm-list">
          {items.map((c) => (
            <div className="adm-row" key={c.id}>
              <div className="adm-row-main">
                <b>{c.brand} {c.model}</b>
                <small>{c.variant || "ทุกปี / ทุกรุ่นย่อย"}</small>
                <small>{c.sizes.join(" · ")}</small>
              </div>
              <div className="adm-row-actions">
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEdit(c)}>แก้ไข</button>
                {canDelete && <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(c)} disabled={busy}>ลบ</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
