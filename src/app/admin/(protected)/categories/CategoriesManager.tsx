"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { PRODUCT_TYPES, typeLabel, type ProductType } from "@/lib/product-meta";

type Category = { id: string; name: string; sort_order: number; product_type: ProductType };

export default function CategoriesManager({ initial, canDelete }: { initial: Category[]; canDelete: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ProductType>("new_tire");
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await sb()
      .from("categories")
      .insert({ name: n, sort_order: items.length, product_type: kind })
      .select("id,name,sort_order,product_type")
      .single();
    setBusy(false);
    if (error) {
      setErr(error.code === "23505" ? "มีประเภทนี้อยู่แล้ว" : "เพิ่มไม่สำเร็จ");
      return;
    }
    setItems((xs) => [...xs, data as Category]);
    setName("");
    router.refresh();
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editing.name.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("categories").update({ name: n }).eq("id", editing.id);
    setBusy(false);
    if (error) {
      setErr(error.code === "23505" ? "มีประเภทนี้อยู่แล้ว" : "บันทึกไม่สำเร็จ");
      return;
    }
    setItems((xs) => xs.map((x) => (x.id === editing.id ? { ...x, name: n } : x)));
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("ลบประเภทนี้? สินค้าที่ใช้ประเภทนี้อยู่จะลบไม่ได้จนกว่าจะย้ายประเภทก่อน")) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("categories").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setErr("ลบไม่สำเร็จ (อาจมีสินค้าใช้ประเภทนี้อยู่)");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <>
      <form className="adm-card adm-form" onSubmit={add} style={{ marginBottom: 16 }}>
        <div className="adm-f-row">
          <label className="adm-f">ชื่อประเภทสินค้าใหม่
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ยางรถเก๋ง" />
          </label>
          <label className="adm-f">ฟอร์มกรอกข้อมูลสินค้า
            <select value={kind} onChange={(e) => setKind(e.target.value as ProductType)}>
              {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="adm-hint">เลือกแบบฟอร์มที่ใช้กรอกสินค้าในประเภทนี้ (เปลี่ยนภายหลังไม่ได้)</span>
          </label>
        </div>
        {err && <p className="adm-msg err">{err}</p>}
        <div className="adm-actions">
          <button className="btn btn-dark" type="submit" disabled={busy || !name.trim()}>เพิ่ม</button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="adm-empty">ยังไม่มีประเภทสินค้า</p>
      ) : (
        <div className="adm-list">
          {items.map((c) => (
            <div className="adm-row" key={c.id}>
              {editing?.id === c.id ? (
                <>
                  <input
                    className="adm-row-main"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8 }}
                  />
                  <div className="adm-row-actions">
                    <button className="btn btn-dark btn-sm" type="button" onClick={saveEdit} disabled={busy}>บันทึก</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(null)}>ยกเลิก</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="adm-row-main"><b>{c.name}</b><small>ฟอร์ม: {typeLabel(c.product_type)}</small></div>
                  <div className="adm-row-actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(c)}>แก้ไข</button>
                    {canDelete && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(c.id)} disabled={busy}>ลบ</button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
