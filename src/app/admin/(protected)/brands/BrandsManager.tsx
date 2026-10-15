"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { findBrand } from "@/lib/product-meta";

type Brand = { id: string; name: string; used: number };

// แยกชื่อยี่ห้อที่พิมพ์ได้หลายชื่อ คั่นด้วย , ; หรือขึ้นบรรทัดใหม่ — ตัดช่องว่างเกิน และตัดชื่อซ้ำ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
function parseNames(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(/[,;\n]+/)) {
    const n = raw.trim().replace(/\s+/g, " ");
    if (n && !findBrand(out.map((x) => ({ id: x, name: x })), n)) out.push(n);
  }
  return out;
}

export default function BrandsManager({ initial, canDelete }: { initial: Brand[]; canDelete: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<Brand | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]); // ยี่ห้อที่เพิ่งเพิ่มในรอบล่าสุด
  const [skipped, setSkipped] = useState<string[]>([]); // ชื่อที่ข้ามเพราะมีอยู่แล้ว

  const names = parseNames(text);
  const totalUsed = items.reduce((n, b) => n + b.used, 0);
  // ยังมียี่ห้อแต่ยังไม่มีสินค้าเลย = ชวนไปขั้นต่อไป
  const showNext = items.length > 0 && (added.length > 0 || totalUsed === 0);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (names.length === 0) return;
    const fresh = names.filter((n) => !findBrand(items, n));
    const dup = names.filter((n) => findBrand(items, n));
    setErr(null);
    setAdded([]);
    setSkipped([]);
    if (fresh.length === 0) {
      setErr(names.length === 1 ? "มียี่ห้อนี้อยู่แล้ว" : "ยี่ห้อเหล่านี้มีอยู่แล้วทั้งหมด");
      return;
    }
    setBusy(true);
    const { data, error } = await sb().from("brands").insert(fresh.map((name) => ({ name }))).select("id,name");
    setBusy(false);
    if (error || !data) {
      setErr(error?.code === "23505" ? "มียี่ห้อนี้อยู่แล้ว ลองโหลดหน้านี้ใหม่" : "เพิ่มไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    const rows = (data as { id: string; name: string }[]).map((b) => ({ ...b, used: 0 }));
    setItems((xs) => [...xs, ...rows].sort((a, b) => a.name.localeCompare(b.name)));
    setAdded(rows.map((r) => r.name));
    setSkipped(dup);
    setText("");
    router.refresh();
  }

  async function saveEdit() {
    if (!editing) return;
    const n = editing.name.trim().replace(/\s+/g, " ");
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

  async function remove(b: Brand) {
    if (b.used > 0) return;
    if (!confirm(`ลบยี่ห้อ "${b.name}"?`)) return;
    setBusy(true);
    setErr(null);
    setAdded([]);
    const { error } = await sb().from("brands").delete().eq("id", b.id);
    setBusy(false);
    if (error) {
      setErr("ลบไม่สำเร็จ (อาจมีสินค้าใช้ยี่ห้อนี้อยู่)");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== b.id));
    router.refresh();
  }

  return (
    <>
      <form className="adm-card adm-form" onSubmit={add} style={{ marginBottom: 16 }}>
        <label className="adm-f">เพิ่มยี่ห้อ
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="เช่น Michelin"
            rows={2}
            autoComplete="off"
          />
          <span className="adm-hint">เพิ่มหลายยี่ห้อพร้อมกันได้ คั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่</span>
        </label>
        {err && <p className="adm-msg err">{err}</p>}
        {added.length > 0 && (
          <p className="adm-msg ok">
            เพิ่มแล้ว {added.length} ยี่ห้อ: {added.join(", ")}
            {skipped.length > 0 && ` (ข้าม ${skipped.join(", ")} เพราะมีอยู่แล้ว)`}
          </p>
        )}
        <div className="adm-actions">
          <button className="btn btn-dark" type="submit" disabled={busy || names.length === 0}>
            {busy ? "กำลังเพิ่ม..." : names.length > 1 ? `เพิ่ม ${names.length} ยี่ห้อ` : "เพิ่มยี่ห้อ"}
          </button>
        </div>
      </form>

      {showNext && (
        <div className="adm-card adm-next">
          <div>
            <b>{totalUsed === 0 ? "ขั้นต่อไป: เพิ่มสินค้า" : "เพิ่มสินค้าต่อได้เลย"}</b>
            <span>ยี่ห้อที่เพิ่มไว้จะขึ้นให้เลือกในฟอร์มสินค้า</span>
          </div>
          <Link href="/admin/products" className="btn btn-dark">ไปเพิ่มสินค้า</Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="adm-empty">
          <p>ยังไม่มียี่ห้อ พิมพ์ชื่อด้านบนแล้วกด "เพิ่มยี่ห้อ"</p>
          <p style={{ marginTop: 8 }}>
            ไม่อยากเพิ่มตรงนี้ก็ได้ <Link href="/admin/products" style={{ color: "var(--blue)", fontWeight: 700 }}>ไปที่สินค้าและสต็อก</Link> แล้วพิมพ์ยี่ห้อในฟอร์มสินค้า ระบบจะเพิ่มให้เอง
          </p>
        </div>
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
                    style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 16 }}
                  />
                  <div className="adm-row-actions">
                    <button className="btn btn-dark btn-sm" type="button" onClick={saveEdit} disabled={busy}>บันทึก</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(null)}>ยกเลิก</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="adm-row-main">
                    <b>{b.name}</b>
                    <small>{b.used > 0 ? `สินค้า ${b.used.toLocaleString("th-TH")} รายการ` : "ยังไม่มีสินค้า"}</small>
                  </div>
                  <div className="adm-row-actions">
                    {b.used > 0 && (
                      <Link href={`/admin/products?q=${encodeURIComponent(b.name)}`} className="btn btn-ghost btn-sm">ดูสินค้า</Link>
                    )}
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(b)}>แก้ไข</button>
                    {canDelete && b.used === 0 && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(b)} disabled={busy}>ลบ</button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {canDelete && items.some((b) => b.used > 0) && (
        <p className="adm-hint" style={{ marginTop: 10 }}>ยี่ห้อที่ยังมีสินค้าใช้อยู่จะไม่มีปุ่มลบ ต้องย้ายหรือลบสินค้าก่อน</p>
      )}
    </>
  );
}
