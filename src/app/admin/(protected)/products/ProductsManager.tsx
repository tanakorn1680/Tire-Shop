"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { imageUrl } from "@/lib/supabase";
import ProductForm from "./ProductForm";

export type AdminProduct = {
  id: string; brand_id: string; brand_name: string; name: string; model: string | null;
  width_mm: number; aspect_ratio: number; rim_inch: number; size_label: string;
  load_index: string | null; speed_rating: string | null;
  cost_price: number; sale_price: number; stock_qty: number; low_stock_threshold: number;
  image_path: string | null; category_id: string | null; is_active: boolean;
};
export type Named = { id: string; name: string };

export default function ProductsManager({
  initial, brands, categories,
}: { initial: AdminProduct[]; brands: Named[]; categories: Named[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    return (
      <ProductForm
        product={editing === "new" ? null : editing}
        brands={brands}
        categories={categories}
        onDone={(saved) => {
          if (saved) { upsertLocal(saved); router.refresh(); }
          setEditing(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="adm-actions" style={{ marginBottom: 16, justifyContent: "flex-start" }}>
        <button className="btn btn-dark" type="button" onClick={() => setEditing("new")}>+ เพิ่มสินค้า</button>
      </div>
      {err && <p className="adm-msg err" style={{ marginBottom: 12 }}>{err}</p>}
      {items.length === 0 ? (
        <p className="adm-empty">ยังไม่มีสินค้า</p>
      ) : (
        <div className="adm-list">
          {items.map((p) => {
            const img = imageUrl(p.image_path);
            return (
              <div className="adm-row" key={p.id}>
                {img ? (
                  <img className="adm-thumb" src={img} alt="" />
                ) : (
                  <div className="adm-thumb" />
                )}
                <div className="adm-row-main">
                  <b>{p.brand_name} {p.name}{p.model ? ` ${p.model}` : ""}</b>
                  <small>{p.size_label} · ฿{Number(p.sale_price).toLocaleString("th-TH")} · สต็อก {p.stock_qty}</small>
                </div>
                <span className={`adm-row-tag ${p.is_active ? "" : "off"}`}>{p.is_active ? "แสดง" : "ซ่อน"}</span>
                {p.stock_qty <= p.low_stock_threshold && (
                  <span className="adm-row-tag off">สต็อกใกล้หมด</span>
                )}
                <div className="adm-row-actions">
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => toggleActive(p)} disabled={busy}>
                    {p.is_active ? "ซ่อน" : "แสดง"}
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(p)}>แก้ไข</button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(p.id)} disabled={busy}>ลบ</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
