"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { imageUrl } from "@/lib/supabase";
import {
  baht, isLowStock, matchesQuery, specText, typeLabel, typeUnit,
  type AdminProduct, type Category, type Named, type ProductType,
} from "@/lib/product-meta";
import ProductForm from "./ProductForm";

const PAGE = 50;
const CLS: Record<ProductType, string> = { new_tire: "t-new", used_tire: "t-used", wheel: "t-wheel" };

export default function ProductsManager({
  initial, brands, categories, canDelete, initialQ, initialAdd = false,
}: {
  initial: AdminProduct[]; brands: Named[]; categories: Category[];
  canDelete: boolean; initialQ: string; initialAdd?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(initialAdd ? "new" : null); // "new" = เพิ่มใหม่
  const [tabRaw, setTab] = useState<string>("all"); // "all" หรือ id ของประเภทสินค้า
  const [q, setQ] = useState(initialQ);
  const [lowOnly, setLowOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const t of categories) c[t.id] = items.filter((p) => p.category_id === t.id).length;
    return c;
  }, [items, categories]);

  // แท็บประเภทจะปรากฏเมื่อมีสินค้าประเภทนั้นแล้วเท่านั้น (ถ้าประเภทที่เลือกอยู่ไม่เหลือสินค้า ให้กลับไปแท็บทั้งหมด)
  const tab: string = tabRaw !== "all" && !counts[tabRaw] ? "all" : tabRaw;
  const typesInUse = categories.filter((t) => counts[t.id] > 0);

  const filtered = useMemo(
    () => items.filter((p) => (tab === "all" || p.category_id === tab) && (!lowOnly || isLowStock(p)) && matchesQuery(p, q)),
    [items, tab, q, lowOnly],
  );
  const shown = filtered.slice(0, limit);

  function upsertLocal(p: AdminProduct) {
    setItems((xs) => {
      const i = xs.findIndex((x) => x.id === p.id);
      if (i === -1) return [p, ...xs];
      const next = [...xs];
      next[i] = p;
      return next;
    });
  }

  async function toggleActive(p: AdminProduct) {
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    setBusy(false);
    if (error) { setErr("เปลี่ยนสถานะไม่สำเร็จ"); return; }
    setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("ลบสินค้านี้? ไม่สามารถกู้คืนได้")) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("products").delete().eq("id", id);
    setBusy(false);
    if (error) { setErr("ลบไม่สำเร็จ"); return; }
    setItems((xs) => xs.filter((x) => x.id !== id));
    router.refresh();
  }

  if (editing) {
    const isNew = editing === "new";
    return (
      <ProductForm
        product={isNew ? null : editing}
        brands={brands}
        categories={categories}
        canDelete={canDelete}
        onDone={(saved) => {
          if (saved) { upsertLocal(saved); router.refresh(); }
          setEditing(null);
        }}
      />
    );
  }

  // กดเพิ่มสินค้า = เข้าฟอร์มเลย เลือกประเภทในฟอร์มได้
  function onAdd() {
    setEditing("new");
  }

  return (
    <>
      {items.length > 0 && (
        <div className="adm-tabs" role="tablist">
          <button type="button" className={`adm-tab ${tab === "all" ? "on" : ""}`} onClick={() => { setTab("all"); setLimit(PAGE); }}>
            ทั้งหมด<span>{counts.all}</span>
          </button>
          {typesInUse.map((t) => (
            <button key={t.id} type="button" className={`adm-tab ${CLS[t.product_type]} ${tab === t.id ? "on" : ""}`} onClick={() => { setTab(t.id); setLimit(PAGE); }}>
              {t.name}<span>{counts[t.id]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="adm-bar">
        {items.length > 0 && (
          <>
            <input
              className="adm-search"
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }}
              placeholder="ค้นหา ชื่อ ยี่ห้อ รุ่น ขนาด หรือรหัสสินค้า"
            />
            <button type="button" className={`adm-tab ${lowOnly ? "on" : ""}`} onClick={() => setLowOnly((v) => !v)}>
              ใกล้หมด
            </button>
          </>
        )}
        <button className="btn btn-dark" type="button" onClick={onAdd} style={items.length === 0 ? undefined : { marginLeft: "auto" }}>
          + เพิ่มสินค้า
        </button>
      </div>

      {err && <p className="adm-msg err" style={{ marginBottom: 12 }}>{err}</p>}

      {items.length === 0 ? (
        <div className="adm-empty">
          <p>ยังไม่มีสินค้า กด "+ เพิ่มสินค้า" แล้วเพิ่มประเภทสินค้าและยี่ห้อได้ในฟอร์มเลย</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="adm-empty">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
      ) : (
        <>
          <p className="adm-sub">แสดง {shown.length} จาก {filtered.length} รายการ</p>
          <table className="adm-tbl">
            <thead>
              <tr>
                <th>รูป</th><th>สินค้า</th><th>ขนาด / รายละเอียด</th><th>ประเภท</th>
                <th className="num">คงเหลือ</th><th className="num">ราคาขาย</th><th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const img = imageUrl(p.image_path);
                const unit = typeUnit(p.product_type);
                const stock = p.is_individual ? (p.stock_qty > 0 ? "พร้อมขาย" : "ขายแล้ว") : `${p.stock_qty} ${unit}`;
                return (
                  <tr key={p.id}>
                    <td data-label="รูป">{img ? <img className="adm-thumb" src={img} alt="" /> : <div className="adm-thumb" />}</td>
                    <td className="main">
                      <b>{p.brand_name} {p.name}{p.model ? ` ${p.model}` : ""}</b>
                      <small>
                        {p.sku ? `รหัส ${p.sku}` : ""}{p.sku && p.storage_location ? " · " : ""}{p.storage_location ? `ที่เก็บ ${p.storage_location}` : ""}
                      </small>
                    </td>
                    <td data-label="ขนาด">{specText(p) || "-"}</td>
                    <td data-label="ประเภท"><span className={`adm-pill ${CLS[p.product_type]}`}>{categories.find((c) => c.id === p.category_id)?.name ?? typeLabel(p.product_type)}</span></td>
                    <td className="num" data-label="คงเหลือ">
                      <span className={isLowStock(p) ? "adm-low" : ""}>{stock}</span>
                      {isLowStock(p) && <span className="adm-row-tag off" style={{ marginLeft: 6 }}>ใกล้หมด</span>}
                      {!p.is_active && <span className="adm-row-tag off" style={{ marginLeft: 6 }}>ซ่อน</span>}
                    </td>
                    <td className="num" data-label="ราคาขาย">฿{baht(p.sale_price)}</td>
                    <td className="acts-c">
                      <div className="acts">
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(p)}>แก้ไข</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => toggleActive(p)} disabled={busy}>
                          {p.is_active ? "ซ่อน" : "แสดง"}
                        </button>
                        {canDelete && (
                          <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(p.id)} disabled={busy}>ลบ</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > shown.length && (
            <div className="adm-more">
              <button className="btn btn-ghost" type="button" onClick={() => setLimit((n) => n + PAGE)}>แสดงเพิ่ม</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
