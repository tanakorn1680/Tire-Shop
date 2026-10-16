"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { useConfirm } from "@/components/admin/Confirm";
import { useStockNote } from "@/components/admin/StockNote";
import { HISTORY_FAIL_MSG, historyName, logHistory } from "@/lib/stock-history";
import { useBackOverride } from "@/components/admin/AdminShell";
import { imageUrl } from "@/lib/supabase";
import {
  baht, dateTimeText, isLowStock, matchesQuery, sortProducts, specText, typeLabel, typeUnit,
  type AdminProduct, type Category, type Named, type ProductType,
} from "@/lib/product-meta";
import ProductForm from "./ProductForm";

const PAGE = 50;
const CLS: Record<ProductType, string> = { new_tire: "t-new", used_tire: "t-used", wheel: "t-wheel" };

// id ของการ์ดสินค้าที่อยู่ใต้ตำแหน่งนิ้ว/เมาส์
const cardAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-pid]")?.dataset.pid ?? null;

export default function ProductsManager({
  initial, brands, categories, canDelete, initialQ, initialCat = "all", initialAdd = false,
}: {
  initial: AdminProduct[]; brands: Named[]; categories: Category[];
  canDelete: boolean; initialQ: string; initialCat?: string; initialAdd?: boolean;
}) {
  const router = useRouter();
  const ask = useConfirm();
  const { askNote, noteDialog } = useStockNote();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(initialAdd ? "new" : null); // "new" = เพิ่มใหม่
  const [tabRaw, setTab] = useState<string>(initialCat); // "all" หรือ id ของประเภทสินค้า
  const [q, setQ] = useState(initialQ);
  const [lowOnly, setLowOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({}); // จำนวนที่กำลังปรับ (ยังไม่บันทึก) แยกตาม id
  const [err, setErr] = useState<string | null>(null);
  useBackOverride(editing !== null, () => setEditing(null)); // ปุ่มย้อนกลับด้านบน = ปิดฟอร์มกลับรายการ
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; over: string | null } | null>(null); // กำลังลากการ์ดเพื่อย้ายตำแหน่ง
  const pos = useRef({ x: 0, y: 0 });
  const dragging = drag !== null;

  // ย้ายตำแหน่งได้เฉพาะภายในประเภทเดียวกัน
  const sameCat = (a: string, b: string | null) => {
    const pa = items.find((x) => x.id === a), pb = items.find((x) => x.id === b);
    return !!pa && !!pb && pa.category_id === pb.category_id;
  };

  // ลากใกล้ขอบจอ = เลื่อนหน้าให้อัตโนมัติ (ต้องวัดการ์ดใต้นิ้วใหม่ทุกครั้งที่เลื่อน)
  useEffect(() => {
    if (!dragging) return;
    let raf = 0;
    const tick = () => {
      const { x, y } = pos.current, h = window.innerHeight;
      const dy = y < 90 ? -(90 - y) / 4 - 2 : y > h - 90 ? (y - (h - 90)) / 4 + 2 : 0;
      if (dy) {
        window.scrollBy(0, dy);
        const over = cardAt(x, y);
        setDrag((d) => (d && d.over !== over && over !== d.id && sameCat(d.id, over) ? { ...d, over } : d));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const t of categories) c[t.id] = items.filter((p) => p.category_id === t.id).length;
    return c;
  }, [items, categories]);

  // แท็บประเภทจะปรากฏเมื่อมีสินค้าประเภทนั้นแล้วเท่านั้น (ถ้าประเภทที่เลือกอยู่ไม่เหลือสินค้า ให้กลับไปแท็บทั้งหมด)
  const tab: string = tabRaw !== "all" && !counts[tabRaw] ? "all" : tabRaw;
  const typesInUse = categories.filter((t) => counts[t.id] > 0);

  const ordered = useMemo(() => sortProducts(items, categories), [items, categories]);
  const filtered = useMemo(
    () => ordered.filter((p) => (tab === "all" || p.category_id === tab) && (!lowOnly || isLowStock(p)) && matchesQuery(p, q)),
    [ordered, tab, q, lowOnly],
  );
  const shown = filtered.slice(0, limit);
  // หน้า "ทั้งหมด" บนมือถือมีหัวข้อคั่นแต่ละประเภท (แสดงเมื่อมีมากกว่า 1 ประเภท)
  const multiCat = tab === "all" && new Set(shown.map((x) => x.category_id)).size > 1;

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

  // ปรับจำนวนในหน้ารายการ: สินค้าติดตามรายชิ้นมีได้ 0-1 ตามข้อจำกัดในฐานข้อมูล
  function bump(p: AdminProduct, d: number) {
    const max = p.is_individual ? 1 : Infinity;
    const next = Math.min(max, Math.max(0, (qty[p.id] ?? p.stock_qty) + d));
    setQty((m) => {
      const n = { ...m };
      if (next === p.stock_qty) delete n[p.id]; else n[p.id] = next;
      return n;
    });
  }

  async function saveQty(p: AdminProduct) {
    const next = qty[p.id];
    if (next === undefined || next === p.stock_qty) return;
    const unit = typeUnit(p.product_type);
    const note = await askNote({
      action: next > p.stock_qty ? "increase" : "decrease",
      message: `เปลี่ยนจำนวนคงเหลือของ ${p.brand_name} ${p.name}${p.model ? ` ${p.model}` : ""} จาก ${p.stock_qty} เป็น ${next} ${unit} ใช่หรือไม่?`,
    });
    if (!note) return;
    setBusy(true);
    setErr(null);
    const { data, error } = await sb().from("products").update({ stock_qty: next }).eq("id", p.id).select("stock_qty,updated_at").single();
    setBusy(false);
    if (error || !data) { setErr("บันทึกจำนวนไม่สำเร็จ"); return; }
    setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, stock_qty: data.stock_qty, updated_at: data.updated_at } : x)));
    setQty((m) => {
      const n = { ...m };
      delete n[p.id];
      return n;
    });
    router.refresh();
    if (note.record) {
      const logged = await logHistory({
        action: next > p.stock_qty ? "increase" : "decrease", product_id: p.id, product_name: historyName(p.brand_name, p.name, p.model),
        qty_before: p.stock_qty, qty_after: next, reason: note.reason, occurred_at: note.at,
      });
      if (!logged) setErr(HISTORY_FAIL_MSG);
    }
  }

  // บันทึกลำดับทั้งหมดในครั้งเดียว (ids ว่าง = ล้างลำดับ กลับเป็นจัดอัตโนมัติ)
  async function saveOrder(ids: string[]) {
    const prev = items;
    const at = new Map(ids.map((id, i) => [id, i]));
    setItems((xs) => xs.map((x) => ({ ...x, sort_order: at.get(x.id) ?? null })));
    setBusy(true);
    setErr(null);
    const { error } = await sb().rpc("set_product_order", { ids });
    setBusy(false);
    if (error) { setItems(prev); setErr("บันทึกตำแหน่งไม่สำเร็จ"); return; }
    router.refresh();
  }

  // ย้ายการ์ดไปอยู่ตำแหน่งของการ์ดปลายทาง (ลำดับจริงคิดจากสินค้าทั้งหมด ไม่ใช่เฉพาะที่กรองอยู่)
  function moveTo(fromId: string, toId: string) {
    const ids = ordered.map((x) => x.id);
    const from = ids.indexOf(fromId), to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    return saveOrder(ids);
  }

  async function resetOrder() {
    const ok = await ask({
      title: "จัดเรียงอัตโนมัติ",
      message: "ล้างตำแหน่งที่จัดไว้ แล้วเรียงตามประเภทสินค้า และราคาจากน้อยไปมาก ใช่หรือไม่?",
      confirmText: "จัดเรียงอัตโนมัติ",
    });
    if (ok) await saveOrder([]);
  }

  function startDrag(e: React.PointerEvent<HTMLElement>, id: string) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pos.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, x: e.clientX, y: e.clientY, over: null });
  }
  function moveDrag(e: React.PointerEvent<HTMLElement>) {
    if (!drag) return;
    pos.current = { x: e.clientX, y: e.clientY };
    const over = cardAt(e.clientX, e.clientY);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, over: over && over !== drag.id && sameCat(drag.id, over) ? over : null });
  }
  function endDrag() {
    const d = drag;
    setDrag(null);
    if (d?.over) void moveTo(d.id, d.over);
  }

  async function remove(p: AdminProduct) {
    const note = await askNote({
      action: "delete",
      message: `ลบ ${historyName(p.brand_name, p.name, p.model)} ? ไม่สามารถกู้คืนได้`,
      confirmText: "ลบ",
      danger: true,
    });
    if (!note) return;
    setBusy(true);
    setErr(null);
    const { error } = await sb().from("products").delete().eq("id", p.id);
    setBusy(false);
    if (error) { setErr("ลบไม่สำเร็จ"); return; }
    setItems((xs) => xs.filter((x) => x.id !== p.id));
    router.refresh();
    if (note.record) {
      // สินค้าถูกลบแล้ว จึงไม่ผูก product_id (ประวัติเก็บชื่อสินค้าไว้เอง)
      const logged = await logHistory({
        action: "delete", product_id: null, product_name: historyName(p.brand_name, p.name, p.model),
        qty_before: p.stock_qty, qty_after: 0, reason: note.reason, occurred_at: note.at,
      });
      if (!logged) setErr(HISTORY_FAIL_MSG);
    }
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
      {noteDialog}
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
        {items.length > 0 && (
          <button
            type="button"
            className="adm-icon-btn"
            title="จัดเรียงอัตโนมัติ"
            aria-label="จัดเรียงอัตโนมัติ (ตามประเภท ราคาน้อยไปมาก)"
            onClick={resetOrder}
            disabled={busy || !items.some((x) => x.sort_order !== null)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" /></svg>
          </button>
        )}
        <button className="btn btn-dark" type="button" onClick={onAdd}>
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
          <p className="adm-sub">แสดง {shown.length} จาก {filtered.length} รายการ · ลากที่ปุ่มจุด 6 จุดบนรูป เพื่อย้ายตำแหน่ง</p>
          <div className="adm-grid">
            {shown.map((p, i) => {
              const catName = categories.find((c) => c.id === p.category_id)?.name ?? typeLabel(p.product_type);
              const img = imageUrl(p.image_path);
              const unit = typeUnit(p.product_type);
              const cur = qty[p.id] ?? p.stock_qty;
              const stock = p.is_individual ? (cur > 0 ? "พร้อมขาย" : "ขายแล้ว") : `${cur} ${unit}`;
              return (
                <Fragment key={p.id}>
                {multiCat && (i === 0 || p.category_id !== shown[i - 1].category_id) && <h2 className="adm-cat-h">{catName}</h2>}
                <div data-pid={p.id} className={`adm-card ${drag?.id === p.id ? "drag" : ""} ${drag?.over === p.id ? "over" : ""}`}>
                  <div className="adm-card-img">
                    {img && <img src={img} alt="" loading="lazy" />}
                    <button
                      type="button"
                      className="adm-grip"
                      title="ลากเพื่อย้ายตำแหน่ง"
                      aria-label="ลากเพื่อย้ายตำแหน่ง"
                      disabled={busy}
                      onPointerDown={(e) => startDrag(e, p.id)}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={() => setDrag(null)}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
                    </button>
                    <span className={`adm-pill ${CLS[p.product_type]}`}>{catName}</span>
                  </div>
                  <b className="adm-card-brand">{p.brand_name}</b>
                  <span>{p.name}{p.model ? ` ${p.model}` : ""}</span>
                  <small>{specText(p) || "-"}</small>
                  <div className="adm-card-price">฿{baht(p.sale_price)}</div>
                  <div className="adm-qty">
                    {isLowStock(p) && <span className="adm-row-tag off">ใกล้หมด</span>}
                    {!p.is_active && <span className="adm-row-tag off">ซ่อน</span>}
                    <button type="button" className="adm-qty-btn" aria-label="ลดจำนวน" onClick={() => bump(p, -1)} disabled={busy || cur <= 0}>−</button>
                    <span className={`adm-qty-val ${isLowStock(p) ? "adm-low" : ""}`}>{stock}</span>
                    <button type="button" className="adm-qty-btn" aria-label="เพิ่มจำนวน" onClick={() => bump(p, 1)} disabled={busy || (p.is_individual && cur >= 1)}>+</button>
                    <button type="button" className="btn btn-dark btn-sm" onClick={() => saveQty(p)} disabled={busy || cur === p.stock_qty}>บันทึก</button>
                  </div>
                  <small>แก้ไขล่าสุด {dateTimeText(p.updated_at)}</small>
                  <div className="acts">
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditing(p)}>แก้ไข</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => toggleActive(p)} disabled={busy}>
                      {p.is_active ? "ซ่อน" : "แสดง"}
                    </button>
                    {canDelete && (
                      <button className="btn btn-danger btn-sm" type="button" onClick={() => remove(p)} disabled={busy}>ลบ</button>
                    )}
                  </div>
                </div>
                </Fragment>
              );
            })}
          </div>
          {filtered.length > shown.length && (
            <div className="adm-more">
              <button className="btn btn-ghost" type="button" onClick={() => setLimit((n) => n + PAGE)}>แสดงเพิ่ม</button>
            </div>
          )}
        </>
      )}
      {drag && (
        <div className="adm-ghost" style={{ left: drag.x, top: drag.y }}>
          {(() => { const g = items.find((x) => x.id === drag.id); return g ? `${g.brand_name} ${g.name}` : ""; })()}
        </div>
      )}
    </>
  );
}
