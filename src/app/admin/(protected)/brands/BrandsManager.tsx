"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

type Brand = { id: string; name: string };

export default function BrandsManager({ initial, canDelete }: { initial: Brand[]; canDelete: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await sb().from("brands").insert({ name: n }).select("id,name").single();
    setBusy(false);
    if (error) {
      setErr(error.code === "23505" ? "มียี่ห้อนี้อยู่แล้ว" : "เพิ่มไม่สำเร็จ");
      return;
    }
    setItems((xs) => [...xs, data as Brand].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    router.refresh();
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editing.name.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("brands").update({ name: n }).eq("id", editing.id);
    setBusy(false);
    if (error) {
      setErr(error.code === "23505" ? "มียี่ห้อนี้อยู่แล้ว" : "บันทึกไม่สำเร็จ");
      return;
    }
    setItems((xs) => xs.map((x) => (x.id === editing.id ? { ...x, name: n } : x)));
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("ลบยี่ห้อนี้? ลบไม่ได้ถ้ามีสินค้าใช้ยี่ห้อนี้อยู่")) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("brands").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setErr("ลบไม่สำเร็จ (อาจมีสินค้าใช้ยี่ห้อนี้อยู่)");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <>
      <form className="adm-card adm-form" onSubmit={add} style={{ marginBottom: 16 }}>
        <div className="adm-f-row">
          <label className="adm-f">ยี่ห้อใหม่
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Michelin" />
          </label>
        </div>
        {err && <p className="adm-msg err">{err}</p>}
        <div className="adm-actions">
          <button className="btn btn-dark" type="submit" disabled={busy || !name.trim()}>เพิ่ม</button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="adm-empty">ยังไม่มียี่ห้อ ยี่ห้อจะถูกเพิ่มให้อัตโนมัติเมื่อคุณเพิ่มสินค้าชิ้นแรก หรือเพิ่มเองที่นี่ก็ได้</p>
      ) : (
        <div className="adm-list">
          {items.map((b) => (
            <div className="adm-row" key={b.id}>
              {editing?.id === b.id ? (
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
                  <div className="adm-row-main"><b>{b.name}</b></div>
                  <div className="adm-row-actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(b)}>แก้ไข</button>
                    {canDelete && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(b.id)} disabled={busy}>ลบ</button>
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
