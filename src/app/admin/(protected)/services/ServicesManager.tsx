"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useConfirm } from "@/components/admin/Confirm";

type Service = { id: string; name: string; description: string | null; sort_order: number; is_active: boolean };
type Draft = { name: string; description: string };

export default function ServicesManager({ initial, canDelete }: { initial: Service[]; canDelete: boolean }) {
  const router = useRouter();
  const ask = useConfirm();
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Draft>({ name: "", description: "" });
  const [editing, setEditing] = useState<(Service & Draft) | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = draft.name.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await sb()
      .from("services")
      .insert({ name: n, description: draft.description.trim() || null, sort_order: items.length })
      .select("id,name,description,sort_order,is_active")
      .single();
    setBusy(false);
    if (error) {
      setErr("เพิ่มไม่สำเร็จ");
      return;
    }
    setItems((xs) => [...xs, data as Service]);
    setDraft({ name: "", description: "" });
    router.refresh();
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editing.name.trim();
    if (!n) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb()
      .from("services")
      .update({ name: n, description: editing.description.trim() || null })
      .eq("id", editing.id);
    setBusy(false);
    if (error) {
      setErr("บันทึกไม่สำเร็จ");
      return;
    }
    setItems((xs) => xs.map((x) => (x.id === editing.id ? { ...x, name: n, description: editing.description.trim() || null } : x)));
    setEditing(null);
    router.refresh();
  }

  async function toggleActive(s: Service) {
    setBusy(true);
    const { error } = await sb().from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    setBusy(false);
    if (error) {
      setErr("เปลี่ยนสถานะไม่สำเร็จ");
      return;
    }
    setItems((xs) => xs.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
    router.refresh();
  }

  async function remove(id: string) {
    if (!(await ask({ message: "ลบบริการนี้?", danger: true }))) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("services").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setErr("ลบไม่สำเร็จ");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <>
      <form className="adm-card adm-form" onSubmit={add} style={{ marginBottom: 16 }}>
        <div className="adm-f-row">
          <label className="adm-f">ชื่อบริการใหม่
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="เช่น ถ่วงล้อ" />
          </label>
        </div>
        <label className="adm-f">รายละเอียด (ไม่บังคับ)
          <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>
        {err && <p className="adm-msg err">{err}</p>}
        <div className="adm-actions">
          <button className="btn btn-dark" type="submit" disabled={busy || !draft.name.trim()}>เพิ่ม</button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="adm-empty">ยังไม่มีบริการ</p>
      ) : (
        <div className="adm-list">
          {items.map((s) => (
            <div className="adm-row" key={s.id}>
              {editing?.id === s.id ? (
                <div className="adm-form" style={{ flex: 1 }}>
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8 }}
                  />
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, minHeight: 60 }}
                  />
                  <div className="adm-actions">
                    <button className="btn btn-dark btn-sm" type="button" onClick={saveEdit} disabled={busy}>บันทึก</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(null)}>ยกเลิก</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="adm-row-main">
                    <b>{s.name}</b>
                    {s.description && <small>{s.description}</small>}
                  </div>
                  <span className={`adm-row-tag ${s.is_active ? "" : "off"}`}>{s.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                  <div className="adm-row-actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => toggleActive(s)} disabled={busy}>
                      {s.is_active ? "ปิด" : "เปิด"}
                    </button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing({ ...s, description: s.description ?? "" })}>แก้ไข</button>
                    {canDelete && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(s.id)} disabled={busy}>ลบ</button>
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
