"use client";

import { useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { imageUrl } from "@/lib/supabase";
import type { AdminProduct, Named } from "./ProductsManager";

type Draft = {
  brand_id: string; name: string; model: string;
  width_mm: string; aspect_ratio: string; rim_inch: string;
  load_index: string; speed_rating: string;
  cost_price: string; sale_price: string; stock_qty: string; low_stock_threshold: string;
  category_id: string; is_active: boolean;
};

function toDraft(p: AdminProduct | null): Draft {
  if (!p) {
    return {
      brand_id: "", name: "", model: "",
      width_mm: "", aspect_ratio: "", rim_inch: "",
      load_index: "", speed_rating: "",
      cost_price: "", sale_price: "", stock_qty: "0", low_stock_threshold: "4",
      category_id: "", is_active: true,
    };
  }
  return {
    brand_id: p.brand_id, name: p.name, model: p.model ?? "",
    width_mm: String(p.width_mm), aspect_ratio: String(p.aspect_ratio), rim_inch: String(p.rim_inch),
    load_index: p.load_index ?? "", speed_rating: p.speed_rating ?? "",
    cost_price: String(p.cost_price), sale_price: String(p.sale_price),
    stock_qty: String(p.stock_qty), low_stock_threshold: String(p.low_stock_threshold),
    category_id: p.category_id ?? "", is_active: p.is_active,
  };
}

export default function ProductForm({
  product, brands, categories, onDone,
}: {
  product: AdminProduct | null;
  brands: Named[];
  categories: Named[];
  onDone: (saved: AdminProduct | null) => void;
}) {
  const [form, setForm] = useState<Draft>(toDraft(product));
  const [imagePath, setImagePath] = useState(product?.image_path ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await sb().storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
    });
    setUploading(false);
    if (error) {
      setErr("อัปโหลดรูปไม่สำเร็จ");
      return;
    }
    setImagePath(path);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const width_mm = Number(form.width_mm), aspect_ratio = Number(form.aspect_ratio), rim_inch = Number(form.rim_inch);
    const cost_price = Number(form.cost_price), sale_price = Number(form.sale_price);
    const stock_qty = Number(form.stock_qty), low_stock_threshold = Number(form.low_stock_threshold);

    if (!form.brand_id) return setErr("กรุณาเลือกยี่ห้อ");
    if (!form.name.trim()) return setErr("กรุณากรอกชื่อสินค้า");
    if (!width_mm || !aspect_ratio || !rim_inch) return setErr("กรุณากรอกขนาดยางให้ครบ");
    if (Number.isNaN(cost_price) || cost_price < 0) return setErr("ราคาต้นทุนไม่ถูกต้อง");
    if (Number.isNaN(sale_price) || sale_price < 0) return setErr("ราคาขายไม่ถูกต้อง");

    const payload = {
      brand_id: form.brand_id,
      name: form.name.trim(),
      model: form.model.trim() || null,
      width_mm, aspect_ratio, rim_inch,
      load_index: form.load_index.trim() || null,
      speed_rating: form.speed_rating.trim() || null,
      cost_price, sale_price,
      stock_qty: Number.isNaN(stock_qty) ? 0 : stock_qty,
      low_stock_threshold: Number.isNaN(low_stock_threshold) ? 4 : low_stock_threshold,
      category_id: form.category_id || null,
      image_path: imagePath,
      is_active: form.is_active,
    };

    setSaving(true);
    const q = product
      ? sb().from("products").update(payload).eq("id", product.id)
      : sb().from("products").insert(payload);
    const { data, error } = await q
      .select("id,brand_id,name,model,width_mm,aspect_ratio,rim_inch,size_label,load_index,speed_rating,cost_price,sale_price,stock_qty,low_stock_threshold,image_path,category_id,is_active,brands(name)")
      .single();
    setSaving(false);

    if (error || !data) {
      setErr("บันทึกไม่สำเร็จ");
      return;
    }
    const row = data as unknown as AdminProduct & { brands: { name: string } | null };
    onDone({ ...row, brand_name: row.brands?.name ?? "" });
  }

  const img = imageUrl(imagePath);

  return (
    <form className="adm-card adm-form" onSubmit={onSubmit}>
      <h1 style={{ fontSize: 16 }}>{product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h1>

      <div className="adm-f-row">
        <label className="adm-f">ยี่ห้อ *
          <select value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
            <option value="">เลือกยี่ห้อ</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label className="adm-f">ประเภทสินค้า
          <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}>
            <option value="">ไม่ระบุ</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="adm-f-row">
        <label className="adm-f">ชื่อรุ่น *
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น Primacy 4" />
        </label>
        <label className="adm-f">รุ่นย่อย
          <input value={form.model} onChange={(e) => set("model", e.target.value)} />
        </label>
      </div>

      <div className="adm-f-row">
        <label className="adm-f">กว้าง (mm) *
          <input type="number" value={form.width_mm} onChange={(e) => set("width_mm", e.target.value)} />
        </label>
        <label className="adm-f">ซีรีย์ (%) *
          <input type="number" value={form.aspect_ratio} onChange={(e) => set("aspect_ratio", e.target.value)} />
        </label>
        <label className="adm-f">วงล้อ (นิ้ว) *
          <input type="number" value={form.rim_inch} onChange={(e) => set("rim_inch", e.target.value)} />
        </label>
      </div>

      <div className="adm-f-row">
        <label className="adm-f">ดัชนีโหลด
          <input value={form.load_index} onChange={(e) => set("load_index", e.target.value)} placeholder="เช่น 91" />
        </label>
        <label className="adm-f">เรทความเร็ว
          <input value={form.speed_rating} onChange={(e) => set("speed_rating", e.target.value)} placeholder="เช่น V" />
        </label>
      </div>

      <div className="adm-f-row">
        <label className="adm-f">ราคาต้นทุน (บาท) *
          <input type="number" step="0.01" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
        </label>
        <label className="adm-f">ราคาขาย (บาท) *
          <input type="number" step="0.01" value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} />
        </label>
      </div>

      <div className="adm-f-row">
        <label className="adm-f">จำนวนสต็อก
          <input type="number" value={form.stock_qty} onChange={(e) => set("stock_qty", e.target.value)} />
        </label>
        <label className="adm-f">แจ้งเตือนเมื่อเหลือ
          <input type="number" value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} />
        </label>
      </div>

      <label className="adm-f">รูปสินค้า
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickImage} disabled={uploading} />
      </label>
      {uploading && <p className="adm-msg">กำลังอัปโหลด...</p>}
      {img && <img src={img} alt="" className="adm-thumb" style={{ width: 80, height: 80 }} />}

      <label className="adm-chk">
        <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
        แสดงสินค้านี้บนหน้าเว็บ
      </label>

      {err && <p className="adm-msg err">{err}</p>}

      <div className="adm-actions">
        <button className="btn btn-ghost" type="button" onClick={() => onDone(null)}>ยกเลิก</button>
        <button className="btn btn-dark" type="submit" disabled={saving || uploading}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
