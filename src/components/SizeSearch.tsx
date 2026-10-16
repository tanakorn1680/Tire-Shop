"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/site.config";
import type { Car } from "@/lib/supabase";

function Sel({ name, label, opts, val, fmt }: {
  name: string; label: string; opts: number[]; val?: string; fmt?: (o: number) => string;
}) {
  return (
    <label>{label}
      <select name={name} defaultValue={val ?? ""}>
        <option value="">เลือก</option>
        {opts.map((o) => <option key={o} value={o}>{fmt ? fmt(o) : o}</option>)}
      </select>
    </label>
  );
}

// ขนาดเช่น 205/55R16 -> ลิงก์ค้นหา
function sizeHref(s: string): string | null {
  const m = /^(\d{3})\/(\d{2})R(\d{2})$/i.exec(s);
  return m ? `/products?w=${m[1]}&a=${m[2]}&r=${m[3]}` : null;
}
const uniq = (xs: string[]) => Array.from(new Set(xs));

// ช่องค้นหายาง 2 แบบ: จากขนาดยาง (A/B/C) และจากรุ่นรถ (ยี่ห้อ > รุ่น > ปี/รุ่นย่อย)
// ถ้าร้านยังไม่เพิ่มข้อมูลรุ่นรถ จะแสดงเฉพาะค้นหาจากขนาดยาง
export default function SizeSearch({ w, a, r, cars = [] }: { w?: string; a?: string; r?: string; cars?: Car[] }) {
  const [mode, setMode] = useState<"size" | "car">("size");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState<string | null>(null);

  const brands = uniq(cars.map((c) => c.brand));
  const models = uniq(cars.filter((c) => c.brand === brand).map((c) => c.model));
  const variants = cars.filter((c) => c.brand === brand && c.model === model);
  const picked = variants.length === 1 ? variants[0] : variants.find((c) => c.variant === variant) ?? null;

  const sizeForm = (
    <>
      <form className="sz" action="/products">
        <Sel name="w" label="กว้าง (มม.)" opts={site.sizes.width} val={w} />
        <Sel name="a" label="แก้มยาง (%)" opts={site.sizes.aspect} val={a} />
        <Sel name="r" label="ขอบ (นิ้ว)" opts={site.sizes.rim} val={r} />
        <button className="btn btn-dark" type="submit">ค้นหา</button>
      </form>
      <p className="s-hint">ดูเลขได้ที่ข้างแก้มยาง เช่น 205/55R16 = กว้าง 205 · แก้ม 55 · ขอบ 16</p>
    </>
  );

  if (cars.length === 0) {
    return (
      <div className="search">
        <h2>ค้นหายางตามขนาด</h2>
        {sizeForm}
      </div>
    );
  }

  return (
    <div className="search">
      <div className="stabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "size"} className={mode === "size" ? "on" : ""} onClick={() => setMode("size")}>ขนาดยาง</button>
        <button type="button" role="tab" aria-selected={mode === "car"} className={mode === "car" ? "on" : ""} onClick={() => setMode("car")}>รุ่นรถ</button>
      </div>
      {mode === "size" ? sizeForm : (
        <>
          <form className="car" onSubmit={(e) => e.preventDefault()}>
            <label>ยี่ห้อ
              <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(""); setVariant(null); }}>
                <option value="">เลือกยี่ห้อ</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
            <label>รุ่น
              <select value={model} disabled={!brand} onChange={(e) => { setModel(e.target.value); setVariant(null); }}>
                <option value="">เลือกรุ่น</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            {variants.length > 1 && (
              <label>ปี / รุ่นย่อย
                <select value={variant ?? ""} onChange={(e) => setVariant(e.target.value)}>
                  <option value="" disabled>เลือกปี / รุ่นย่อย</option>
                  {variants.map((c) => <option key={c.variant} value={c.variant}>{c.variant || "ทุกปี / ทุกรุ่นย่อย"}</option>)}
                </select>
              </label>
            )}
          </form>
          {picked ? (
            <div className="s-res">
              <b>ขนาดยางที่ใช้ได้ — กดเพื่อดูสินค้า</b>
              <div className="s-chips">
                {picked.sizes.map((s) => {
                  const h = sizeHref(s);
                  return h ? <Link key={s} href={h}>{s}</Link> : <span key={s}>{s}</span>;
                })}
              </div>
              <p className="s-hint">ขนาดตามข้อมูลของร้าน ควรตรวจสอบกับทางร้านอีกครั้งก่อนสั่งซื้อ</p>
            </div>
          ) : (
            <p className="s-hint">เลือกยี่ห้อและรุ่น เพื่อดูขนาดยางที่ใช้ได้</p>
          )}
        </>
      )}
    </div>
  );
}
