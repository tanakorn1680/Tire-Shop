"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import GearMenu from "./GearMenu";
import { imageUrl } from "@/lib/supabase";
import {
  PRODUCT_COLUMNS, PRODUCT_TYPES, dotText, findBrand, parseDot, typeLabel, typeUnit,
  type AdminProduct, type Named, type ProductType,
} from "@/lib/product-meta";

type Draft = {
  brand: string; name: string; model: string; sku: string; storage_location: string;
  width_mm: string; aspect_ratio: string; rim_inch: string; load_index: string; speed_rating: string;
  dot: string; tread_depth_mm: string; condition_note: string; defect_note: string; repair_note: string;
  wheel_width_in: string; wheel_pcd: string; wheel_bolts: string; wheel_offset_mm: string;
  cost_price: string; sale_price: string; stock_qty: string; low_stock_threshold: string;
  is_individual: boolean; is_active: boolean;
};

const TYPE_CLS: Record<ProductType, string> = { new_tire: "t-new", used_tire: "t-used", wheel: "t-wheel" };

const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

function toDraft(p: AdminProduct | null, type: ProductType): Draft {
  return {
    brand: p?.brand_name ?? "", name: p?.name ?? "", model: s(p?.model), sku: s(p?.sku),
    storage_location: s(p?.storage_location),
    width_mm: s(p?.width_mm), aspect_ratio: s(p?.aspect_ratio), rim_inch: s(p?.rim_inch),
    load_index: s(p?.load_index), speed_rating: s(p?.speed_rating),
    dot: p ? dotText(p.dot_week, p.dot_year) : "",
    tread_depth_mm: s(p?.tread_depth_mm), condition_note: s(p?.condition_note),
    defect_note: s(p?.defect_note), repair_note: s(p?.repair_note),
    wheel_width_in: s(p?.wheel_width_in), wheel_pcd: s(p?.wheel_pcd),
    wheel_bolts: s(p?.wheel_bolts), wheel_offset_mm: s(p?.wheel_offset_mm),
    cost_price: s(p?.cost_price), sale_price: s(p?.sale_price),
    stock_qty: p ? String(p.stock_qty) : type === "used_tire" ? "1" : "0",
    low_stock_threshold: p ? String(p.low_stock_threshold) : "4",
    is_individual: p ? p.is_individual : type === "used_tire", // ยางมือสองติดตามรายเส้นเป็นค่าเริ่มต้น
    is_active: p?.is_active ?? true,
  };
}

// ช่องตัวเลขที่ไม่บังคับ: ว่าง = null, ไม่ใช่ตัวเลข = NaN
const optNum = (v: string): number | null => (v.trim() === "" ? null : Number(v));

export default function ProductForm({
  product, newType, brands, onDone,
}: {
  product: AdminProduct | null;
  newType?: ProductType;
  brands: Named[];
  onDone: (saved: AdminProduct | null) => void;
}) {
  // เพิ่มสินค้าใหม่: เลือกประเภทในฟอร์มได้เลย ไม่ต้องเปลี่ยนหน้า (แก้ไขสินค้าเดิมเปลี่ยนประเภทไม่ได้)
  const [newT, setNewT] = useState<ProductType>(newType ?? "new_tire");
  const type: ProductType = product?.product_type ?? newT;
  const router = useRouter();
  // กลับจากแท็บเพิ่ม/ลบยี่ห้อ → โหลดรายการยี่ห้อใหม่ (ข้อมูลที่กรอกค้างในฟอร์มยังอยู่)
  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);
  const isWheel = type === "wheel";
  const isUsed = type === "used_tire";
  const unit = typeUnit(type);

  const [form, setForm] = useState<Draft>(toDraft(product, type));
  const [imagePath, setImagePath] = useState(product?.image_path ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // ส่วน "รายละเอียดเพิ่มเติม" พับไว้ตอนเพิ่มสินค้าใหม่ (แก้ไขสินค้าเดิมเปิดไว้) และเปิดเองถ้าผิดพลาดที่ช่องในส่วนนั้น
  const [more, setMore] = useState(!!product);
  const fail = (msg: string, openMore = false) => { if (openMore) setMore(true); setErr(msg); };

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // แผงเลือกประเภทสินค้า (เฉพาะตอนเพิ่มใหม่)
  const [typeOpen, setTypeOpen] = useState(false);
  function pickType(v: ProductType) {
    const wasUsed = type === "used_tire";
    setNewT(v);
    setTypeOpen(false);
    setForm((f) => ({
      ...f,
      is_individual: v === "used_tire",
      stock_qty: v === "used_tire" ? "1" : wasUsed && f.stock_qty === "1" ? "0" : f.stock_qty,
    }));
  }

  // แผงเลือกยี่ห้อที่เลื่อนลงมาจากช่องยี่ห้อ
  const [brandOpen, setBrandOpen] = useState(false);
  const brandInput = useRef<HTMLInputElement>(null);
  const brandBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!brandOpen) return;
    // รอให้แป้นพิมพ์ขึ้นก่อน แล้วเลื่อนช่องยี่ห้อขึ้นมาให้เห็นแผงทั้งอัน
    const id = window.setTimeout(() => brandBox.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 250);
    return () => window.clearTimeout(id);
  }, [brandOpen]);
  function pickBrand(name: string) {
    set("brand", name);
    setBrandOpen(false);
    brandInput.current?.blur(); // เก็บแป้นพิมพ์
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await sb().storage.from("product-images").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
    });
    setUploading(false);
    if (error) {
      setErr("อัปโหลดรูปไม่สำเร็จ (รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5 MB)");
      return;
    }
    setImagePath(path);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const width_mm = optNum(form.width_mm), aspect_ratio = optNum(form.aspect_ratio), rim_inch = optNum(form.rim_inch);
    const cost_price = Number(form.cost_price), sale_price = Number(form.sale_price);
    const stock_qty = Number(form.stock_qty), low_stock_threshold = Number(form.low_stock_threshold);
    const tread = optNum(form.tread_depth_mm);
    const wWidth = optNum(form.wheel_width_in), bolts = optNum(form.wheel_bolts), offset = optNum(form.wheel_offset_mm);
    const dot = parseDot(form.dot);

    if (!form.brand.trim()) return setErr("กรุณาใส่ยี่ห้อ");
    if (!form.name.trim()) return setErr("กรุณากรอกชื่อสินค้า");
    if (isWheel) {
      if (!rim_inch || Number.isNaN(rim_inch) || rim_inch < 8 || rim_inch > 30) return setErr("กรุณากรอกขนาดล้อ (นิ้ว) 8–30");
      if (wWidth !== null && (Number.isNaN(wWidth) || wWidth < 3 || wWidth > 20)) return fail("ความกว้างล้อไม่ถูกต้อง", true);
      if (bolts !== null && (!Number.isInteger(bolts) || bolts < 3 || bolts > 10)) return fail("จำนวนรูน็อตต้องเป็น 3–10", true);
      if (offset !== null && (!Number.isInteger(offset) || offset < -100 || offset > 150)) return fail("Offset ต้องอยู่ระหว่าง -100 ถึง 150", true);
    } else {
      if (!width_mm || !aspect_ratio || !rim_inch || [width_mm, aspect_ratio, rim_inch].some(Number.isNaN)) {
        return setErr("กรุณากรอกขนาดยางให้ครบ (กว้าง / ซีรีย์ / วงล้อ)");
      }
      if (width_mm < 100 || width_mm > 450 || aspect_ratio < 20 || aspect_ratio > 95 || rim_inch < 8 || rim_inch > 30) {
        return setErr("ขนาดยางอยู่นอกช่วงที่ระบบรองรับ กรุณาตรวจสอบตัวเลขอีกครั้ง");
      }
      if (dot === "invalid") return fail("DOT ต้องเป็นตัวเลข 4 หลัก สัปดาห์ 01–53 ตามด้วยปี 2 หลัก เช่น 2524", true);
      if (tread !== null && (Number.isNaN(tread) || tread < 0 || tread > 15)) return setErr("ความลึกดอกยางต้องอยู่ระหว่าง 0–15 มม.");
    }
    if (form.cost_price.trim() === "" || Number.isNaN(cost_price) || cost_price < 0) return setErr("ราคาทุนไม่ถูกต้อง");
    if (form.sale_price.trim() === "" || Number.isNaN(sale_price) || sale_price < 0) return setErr("ราคาขายไม่ถูกต้อง");
    if (!Number.isInteger(stock_qty) || stock_qty < 0) return setErr("จำนวนคงเหลือต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
    if (form.is_individual && stock_qty > 1) return setErr(`สินค้าติดตามรายชิ้นมีได้ไม่เกิน 1 ${unit} (ถ้ามีหลายชิ้นให้เพิ่มเป็นหลายรายการ)`);
    if (!form.is_individual && (Number.isNaN(low_stock_threshold) || low_stock_threshold < 0)) return fail("จำนวนแจ้งเตือนไม่ถูกต้อง", true);

    const dotOk = !isWheel && dot !== "invalid" ? dot : null;
    const payload = {
      product_type: type,
      name: form.name.trim(),
      model: form.model.trim() || null,
      sku: form.sku.trim() || null,
      storage_location: form.storage_location.trim() || null,
      width_mm: isWheel ? null : width_mm,
      aspect_ratio: isWheel ? null : aspect_ratio,
      rim_inch,
      load_index: isWheel ? null : form.load_index.trim() || null,
      speed_rating: isWheel ? null : form.speed_rating.trim() || null,
      dot_week: dotOk ? dotOk.week : null,
      dot_year: dotOk ? dotOk.year : null,
      tread_depth_mm: isUsed ? tread : null,
      condition_note: isUsed || isWheel ? form.condition_note.trim() || null : null,
      defect_note: isUsed ? form.defect_note.trim() || null : null,
      repair_note: isUsed ? form.repair_note.trim() || null : null,
      wheel_width_in: isWheel ? wWidth : null,
      wheel_pcd: isWheel ? form.wheel_pcd.trim() || null : null,
      wheel_bolts: isWheel ? bolts : null,
      wheel_offset_mm: isWheel ? offset : null,
      cost_price, sale_price, stock_qty,
      low_stock_threshold: Number.isNaN(low_stock_threshold) ? 4 : low_stock_threshold,
      is_individual: form.is_individual,
      image_path: imagePath,
      is_active: form.is_active,
    };

    setSaving(true);

    // ยี่ห้อ: มีอยู่แล้วใช้เลย ถ้ายังไม่มีเพิ่มให้อัตโนมัติ (ไม่ต้องไปหน้าอื่น)
    let brandId = findBrand(brands, form.brand)?.id;
    if (!brandId) {
      const { data: nb, error: be } = await sb().from("brands").insert({ name: form.brand.trim().replace(/\s+/g, " ") }).select("id").single();
      if (be || !nb) {
        setSaving(false);
        return setErr("เพิ่มยี่ห้อไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
      brandId = (nb as { id: string }).id;
    }

    const q = product
      ? sb().from("products").update({ ...payload, brand_id: brandId }).eq("id", product.id)
      : sb().from("products").insert({ ...payload, brand_id: brandId });
    const { data, error } = await q.select(PRODUCT_COLUMNS).single();
    setSaving(false);

    if (error || !data) {
      if (error?.code === "23505") fail("รหัสสินค้านี้มีอยู่แล้ว กรุณาใช้รหัสอื่น หรือเว้นว่างไว้ก่อน", true);
      else fail("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    const row = data as unknown as AdminProduct & { brands: { name: string } | null };
    onDone({ ...row, brand_name: row.brands?.name ?? "" });
  }

  const img = imageUrl(imagePath);
  const typedBrand = form.brand.trim().replace(/\s+/g, " ");
  const pickedBrand = typedBrand ? findBrand(brands, form.brand) : undefined;
  // ระหว่างพิมพ์ แสดงเฉพาะยี่ห้อที่ตรงกับตัวอักษรที่พิมพ์ (ถ้ายังไม่พิมพ์แสดงทั้งหมด)
  const brandChoices = typedBrand && !pickedBrand
    ? brands.filter((b) => b.name.toLowerCase().includes(typedBrand.toLowerCase()))
    : brands;

  // รูปสินค้า: ยางมือสองต้องถ่ายสภาพจริง จึงวางไว้ด้านนอก ประเภทอื่นอยู่ในรายละเอียดเพิ่มเติม
  const imageBlock = (
    <>
      <label className="adm-f">{isUsed ? "รูปสินค้า (ถ่ายสภาพจริง)" : "รูปสินค้า"}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickImage} disabled={uploading} />
      </label>
      {uploading && <p className="adm-msg">กำลังอัปโหลด...</p>}
      {img && <img src={img} alt="" className="adm-thumb" style={{ width: 96, height: 96 }} />}
    </>
  );

  return (
    <form className="adm-card adm-form" onSubmit={onSubmit}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <h1 style={{ fontSize: 17 }}>{product ? "แก้ไข" : "เพิ่ม"}{typeLabel(type)}</h1>
        <GearMenu newTab />
      </div>

      <fieldset className="adm-fs">
        <legend>ข้อมูลสินค้า</legend>
        {!product && (
          <div className="adm-f" style={{ marginBottom: 12 }}>
            <label htmlFor="type-input">ประเภทสินค้า *</label>
            <div className={`adm-combo ${TYPE_CLS[type]} ${typeOpen ? "open" : ""}`}>
              <input
                id="type-input"
                value={typeLabel(type)}
                readOnly
                inputMode="none"
                onClick={() => { setBrandOpen(false); setTypeOpen((v) => !v); }}
                onBlur={() => setTypeOpen(false)}
                style={{ cursor: "pointer" }}
                role="combobox"
                aria-expanded={typeOpen}
                aria-controls="type-pop"
              />
              <button
                type="button"
                className="adm-combo-arrow"
                tabIndex={-1}
                aria-label={typeOpen ? "ปิดรายการประเภท" : "เปิดรายการประเภท"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setBrandOpen(false); setTypeOpen((v) => !v); }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {typeOpen && (
                <div id="type-pop" className="adm-pop" role="listbox" onMouseDown={(e) => e.preventDefault()}>
                  {PRODUCT_TYPES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={o.value === type}
                      className={`adm-pop-o ${o.value === type ? "on" : ""}`}
                      onClick={() => pickType(o.value)}
                    >
                      <span>{o.label}</span>
                      {o.value === type && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="adm-f-row">
          <div className="adm-f">
            <label htmlFor="brand-input">ยี่ห้อ *</label>
            <div className={`adm-combo ${TYPE_CLS[type]} ${brandOpen ? "open" : ""}`} ref={brandBox}>
              <input
                id="brand-input"
                ref={brandInput}
                value={form.brand}
                onChange={(e) => { set("brand", e.target.value); setTypeOpen(false); setBrandOpen(true); }}
                onFocus={() => { setTypeOpen(false); setBrandOpen(true); }}
                onBlur={() => setBrandOpen(false)}
                onKeyDown={(e) => { if (e.key === "Escape") setBrandOpen(false); }}
                placeholder="แตะเพื่อเลือก หรือพิมพ์ยี่ห้อใหม่"
                autoComplete="off"
                role="combobox"
                aria-expanded={brandOpen}
                aria-controls="brand-pop"
              />
              <button
                type="button"
                className="adm-combo-arrow"
                tabIndex={-1}
                aria-label={brandOpen ? "ปิดรายการยี่ห้อ" : "เปิดรายการยี่ห้อ"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { if (brandOpen) { setBrandOpen(false); brandInput.current?.blur(); } else brandInput.current?.focus(); }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {brandOpen && (
                <div
                  id="brand-pop"
                  className="adm-pop"
                  role="listbox"
                  onMouseDown={(e) => e.preventDefault()} // ไม่ให้ช่องเสียโฟกัสก่อนแตะเลือก
                >
                  {typedBrand && !pickedBrand && (
                    <button type="button" className="adm-pop-new" onClick={() => pickBrand(typedBrand)}>
                      + ใช้ยี่ห้อใหม่ "{typedBrand}"
                    </button>
                  )}
                  {brandChoices.map((b) => {
                    const on = pickedBrand?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        role="option"
                        aria-selected={on}
                        className={`adm-pop-o ${on ? "on" : ""}`}
                        onClick={() => pickBrand(b.name)}
                      >
                        <span>{b.name}</span>
                        {on && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                      </button>
                    );
                  })}
                  {brandChoices.length === 0 && !typedBrand && <span className="adm-pop-t">พิมพ์ชื่อยี่ห้อได้เลย</span>}
                </div>
              )}
            </div>
            {typedBrand && !pickedBrand && !brandOpen && (
              <span className="adm-hint">ยี่ห้อใหม่ ระบบจะเพิ่ม "{typedBrand}" ให้เมื่อกดบันทึก</span>
            )}
          </div>
          <label className="adm-f">ชื่อรุ่น *
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={isWheel ? "เช่น Enkei RPF1" : "เช่น Primacy 4"} />
          </label>
        </div>
      </fieldset>

      <fieldset className="adm-fs">
        <legend>{isWheel ? "ขนาดล้อ" : "ขนาดยาง"}</legend>
        {isWheel ? (
          <div className="adm-f-row">
            <label className="adm-f">ขนาด (นิ้ว) *
              <input type="number" inputMode="decimal" value={form.rim_inch} onChange={(e) => set("rim_inch", e.target.value)} placeholder="เช่น 17" />
            </label>
          </div>
        ) : (
          <div className="adm-f-row">
            <label className="adm-f">กว้าง (มม.) *
              <input type="number" inputMode="numeric" value={form.width_mm} onChange={(e) => set("width_mm", e.target.value)} placeholder="เช่น 205" />
            </label>
            <label className="adm-f">ซีรีย์ (%) *
              <input type="number" inputMode="numeric" value={form.aspect_ratio} onChange={(e) => set("aspect_ratio", e.target.value)} placeholder="เช่น 55" />
            </label>
            <label className="adm-f">วงล้อ (นิ้ว) *
              <input type="number" inputMode="numeric" value={form.rim_inch} onChange={(e) => set("rim_inch", e.target.value)} placeholder="เช่น 16" />
            </label>
            {isUsed && (
              <label className="adm-f">ความลึกดอกยาง (มม.)
                <input type="number" inputMode="decimal" step="0.1" value={form.tread_depth_mm} onChange={(e) => set("tread_depth_mm", e.target.value)} placeholder="เช่น 6.5" />
              </label>
            )}
          </div>
        )}
      </fieldset>

      <fieldset className="adm-fs">
        <legend>ราคาและจำนวน</legend>
        <div className="adm-f-row">
          <label className="adm-f">ราคาทุน (บาท) *
            <input type="number" inputMode="decimal" step="0.01" value={form.cost_price} onChange={(e) => set("cost_price", e.target.value)} />
          </label>
          <label className="adm-f">ราคาขาย (บาท) *
            <input type="number" inputMode="decimal" step="0.01" value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} />
          </label>
          <label className="adm-f">จำนวนคงเหลือ ({unit})
            <input type="number" inputMode="numeric" min={0} max={form.is_individual ? 1 : undefined} value={form.stock_qty} onChange={(e) => set("stock_qty", e.target.value)} />
          </label>
        </div>
      </fieldset>

      {isUsed && imageBlock}

      <details className="adm-opt" open={more} onToggle={(e) => setMore(e.currentTarget.open)}>
        <summary>รายละเอียดเพิ่มเติม <span>ไม่บังคับ กรอกทีหลังได้</span></summary>
        <div className="adm-opt-body">
          <div className="adm-f-row">
            <label className="adm-f">รหัสสินค้า
              <input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="เช่น MIC-2055516-01" />
            </label>
            <label className="adm-f">ตำแหน่งจัดเก็บ
              <input value={form.storage_location} onChange={(e) => set("storage_location", e.target.value)} placeholder="เช่น ชั้น A แถว 2" />
            </label>
            <label className="adm-f">{isWheel ? "รุ่นย่อย / ลาย" : "รุ่นย่อย"}
              <input value={form.model} onChange={(e) => set("model", e.target.value)} />
            </label>
          </div>

          {isWheel ? (
            <>
              <div className="adm-f-row">
                <label className="adm-f">ความกว้าง (นิ้ว)
                  <input type="number" inputMode="decimal" step="0.5" value={form.wheel_width_in} onChange={(e) => set("wheel_width_in", e.target.value)} placeholder="เช่น 8.5" />
                </label>
                <label className="adm-f">PCD
                  <input value={form.wheel_pcd} onChange={(e) => set("wheel_pcd", e.target.value)} placeholder="เช่น 5x114.3" />
                </label>
              </div>
              <div className="adm-f-row">
                <label className="adm-f">จำนวนรูน็อต
                  <input type="number" inputMode="numeric" value={form.wheel_bolts} onChange={(e) => set("wheel_bolts", e.target.value)} placeholder="เช่น 5" />
                </label>
                <label className="adm-f">Offset (ET)
                  <input type="number" inputMode="numeric" value={form.wheel_offset_mm} onChange={(e) => set("wheel_offset_mm", e.target.value)} placeholder="เช่น 35" />
                </label>
              </div>
            </>
          ) : (
            <div className="adm-f-row">
              <label className="adm-f">ดัชนีโหลด
                <input value={form.load_index} onChange={(e) => set("load_index", e.target.value)} placeholder="เช่น 91" />
              </label>
              <label className="adm-f">เรทความเร็ว
                <input value={form.speed_rating} onChange={(e) => set("speed_rating", e.target.value)} placeholder="เช่น V" />
              </label>
              <label className="adm-f">DOT (สัปดาห์+ปี 4 หลัก)
                <input inputMode="numeric" maxLength={4} value={form.dot} onChange={(e) => set("dot", e.target.value)} placeholder="เช่น 2524" />
              </label>
            </div>
          )}

          {(isUsed || isWheel) && (
            <>
              <label className="adm-f">สภาพ
                <textarea value={form.condition_note} onChange={(e) => set("condition_note", e.target.value)} placeholder={isWheel ? "เช่น สภาพดี ไม่มีรอยแตก" : "เช่น ยางสวย ไม่มีบวม"} />
              </label>
              {isUsed && (
                <div className="adm-f-row">
                  <label className="adm-f">ตำหนิ
                    <textarea value={form.defect_note} onChange={(e) => set("defect_note", e.target.value)} />
                  </label>
                  <label className="adm-f">รอยซ่อม
                    <textarea value={form.repair_note} onChange={(e) => set("repair_note", e.target.value)} />
                  </label>
                </div>
              )}
            </>
          )}

          <label className="adm-chk">
            <input type="checkbox" checked={form.is_individual} onChange={(e) => set("is_individual", e.target.checked)} />
            ติดตามรายชิ้น (1 {unit} = 1 รายการ ป้องกันการขายซ้ำ)
          </label>
          {!form.is_individual && (
            <label className="adm-f">แจ้งเตือนเมื่อเหลือ ({unit})
              <input type="number" inputMode="numeric" min={0} value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} />
            </label>
          )}

          {!isUsed && imageBlock}

          <label className="adm-chk">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            แสดงสินค้านี้บนหน้าเว็บ
          </label>
        </div>
      </details>

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
