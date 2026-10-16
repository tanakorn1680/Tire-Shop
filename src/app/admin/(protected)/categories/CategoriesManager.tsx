"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useConfirm } from "@/components/admin/Confirm";
import { findBrand, guessKind, type ProductType } from "@/lib/product-meta";

type Category = { id: string; name: string; sort_order: number; product_type: ProductType; used: number };

// แยกชื่อประเภทที่พิมพ์ได้หลายชื่อ คั่นด้วย , ; หรือขึ้นบรรทัดใหม่ — ตัดช่องว่างเกิน และตัดชื่อซ้ำ (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
function parseNames(input: string): string[] {
  const out: string[] = [];
  for (const raw of input.split(/[,;\n]+/)) {
    const n = raw.trim().replace(/\s+/g, " ");
    if (n && !findBrand(out.map((x) => ({ id: x, name: x })), n)) out.push(n);
  }
  return out;
}

export default function CategoriesManager({ initial, canDelete }: { initial: Category[]; canDelete: boolean }) {
  const router = useRouter();
  const ask = useConfirm();
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);

  const names = parseNames(text);
  const totalUsed = items.reduce((n, c) => n + c.used, 0);
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
      setErr(names.length === 1 ? "มีประเภทนี้อยู่แล้ว" : "ประเภทเหล่านี้มีอยู่แล้วทั้งหมด");
      return;
    }
    setBusy(true);
    // แบบฟอร์มกรอกสินค้า (ยาง/ยางมือสอง/ล้อแม็ก) ระบบดูจากชื่อประเภทให้เอง
    const { data, error } = await sb()
      .from("categories")
      .insert(fresh.map((name, i) => ({ name, sort_order: items.length + i, product_type: guessKind(name) ?? "new_tire" })))
      .select("id,name,sort_order,product_type");
    setBusy(false);
    if (error || !data) {
      setErr(error?.code === "23505" ? "มีประเภทนี้อยู่แล้ว ลองโหลดหน้านี้ใหม่" : "เพิ่มไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    const rows = (data as Omit<Category, "used">[]).map((c) => ({ ...c, used: 0 }));
    setItems((xs) => [...xs, ...rows]);
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

  async function remove(c: Category) {
    if (c.used > 0) return;
    if (!(await ask({ message: `ลบประเภท "${c.name}"?`, danger: true }))) return;
    setBusy(true);
    setErr(null);
    setAdded([]);
    const { error } = await sb().from("categories").delete().eq("id", c.id);
    setBusy(false);
    if (error) {
      setErr("ลบไม่สำเร็จ (อาจมีสินค้าใช้ประเภทนี้อยู่)");
      return;
    }
    setItems((xs) => xs.filter((x) => x.id !== c.id));
    router.refresh();
  }

  return (
    <>
      <form className="adm-card adm-form" onSubmit={add} style={{ marginBottom: 16 }}>
        <label className="adm-f">เพิ่มประเภทสินค้า
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="เช่น ยางมือหนึ่ง"
            rows={2}
            autoComplete="off"
          />
          <span className="adm-hint">เพิ่มหลายประเภทพร้อมกันได้ คั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่</span>
        </label>
        {err && <p className="adm-msg err">{err}</p>}
        {added.length > 0 && (
          <p className="adm-msg ok">
            เพิ่มแล้ว {added.length} ประเภท: {added.join(", ")}
            {skipped.length > 0 && ` (ข้าม ${skipped.join(", ")} เพราะมีอยู่แล้ว)`}
          </p>
        )}
        <div className="adm-actions">
          <button className="btn btn-dark" type="submit" disabled={busy || names.length === 0}>
            {busy ? "กำลังเพิ่ม..." : names.length > 1 ? `เพิ่ม ${names.length} ประเภท` : "เพิ่มประเภท"}
          </button>
        </div>
      </form>

      {showNext && (
        <div className="adm-card adm-next">
          <div>
            <b>{totalUsed === 0 ? "ขั้นต่อไป: เพิ่มสินค้า" : "เพิ่มสินค้าต่อได้เลย"}</b>
            <span>ประเภทที่เพิ่มไว้จะขึ้นให้เลือกในฟอร์มสินค้า</span>
          </div>
          <Link href="/admin/products" className="btn btn-dark">ไปเพิ่มสินค้า</Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="adm-empty">
          <p>ยังไม่มีประเภทสินค้า พิมพ์ชื่อด้านบนแล้วกด "เพิ่มประเภท"</p>
          <p style={{ marginTop: 8 }}>
            ไม่อยากเพิ่มตรงนี้ก็ได้ <Link href="/admin/products" style={{ color: "var(--blue)", fontWeight: 700 }}>ไปที่สินค้าและสต็อก</Link> แล้วพิมพ์ประเภทในฟอร์มสินค้า ระบบจะเพิ่มให้เอง
          </p>
        </div>
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
                    <b>{c.name}</b>
                    <small>{c.used > 0 ? `สินค้า ${c.used.toLocaleString("th-TH")} รายการ` : "ยังไม่มีสินค้า"}</small>
                  </div>
                  <div className="adm-row-actions">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(c)}>แก้ไข</button>
                    {canDelete && c.used === 0 && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(c)} disabled={busy}>ลบ</button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {canDelete && items.some((c) => c.used > 0) && (
        <p className="adm-hint" style={{ marginTop: 10 }}>ประเภทที่ยังมีสินค้าใช้อยู่จะไม่มีปุ่มลบ ต้องย้ายหรือลบสินค้าก่อน</p>
      )}
    </>
  );
}
