"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sb } from "@/lib/supabase-browser";
import { imageUrl } from "@/lib/supabase";
import { useCart } from "./cart/CartProvider";
import type { OrderItem } from "@/lib/order";

export type Detail = {
  id: string; brand: string; title: string; price: number; inStock: boolean;
  coverPath: string | null; specs: [string, string][];
};

// หน้าต่างรายละเอียดสินค้า: เลื่อนดูหลายรูป (ปัดซ้าย-ขวาหรือกดรูปเล็ก) + ข้อมูลสินค้า + ปุ่มสั่งซื้อ
export default function ProductDetail({ detail, order, onClose }: {
  detail: Detail; order: { item: Omit<OrderItem, "qty">; href: string } | null; onClose: () => void;
}) {
  const cart = useCart();
  const [paths, setPaths] = useState<string[]>(detail.coverPath ? [detail.coverPath] : []);
  const [i, setI] = useState(0);
  const [state, setState] = useState<"idle" | "added" | "full">("idle");
  const x0 = useRef<number | null>(null);

  // โหลดรูปทั้งหมดของสินค้า (ถ้ายังไม่ได้รัน migration 0010 หรือไม่มีรูปเพิ่ม ใช้รูปหลักอย่างเดียว)
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const { data, error } = await sb().from("product_images_public").select("path").eq("product_id", detail.id).order("sort_order");
        if (!off && !error && data && data.length) setPaths(data.map((r) => r.path as string));
      } catch { /* ใช้รูปหลักต่อไป */ }
    })();
    return () => { off = true; };
  }, [detail.id]);

  // ปิดด้วยปุ่ม Esc และล็อกการเลื่อนหน้าเว็บด้านหลัง
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const n = paths.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);
  const cur = n ? imageUrl(paths[Math.min(i, n - 1)]) : null;

  return createPortal(
    <div className="pd-back" onClick={onClose}>
      <div className="pd" role="dialog" aria-modal="true" aria-label={detail.title} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pd-x" aria-label="ปิด" onClick={onClose}>×</button>
        <div className="pd-gal">
          <div
            className="pd-main"
            onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (x0.current === null || n < 2) return;
              const dx = e.changedTouches[0].clientX - x0.current;
              x0.current = null;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            }}
          >
            {cur ? <img src={cur} alt={detail.title} /> : <span className="pd-none">ไม่มีรูปสินค้า</span>}
            {n > 1 && (
              <>
                <button type="button" className="pd-nav pd-prev" aria-label="รูปก่อนหน้า" onClick={() => go(-1)}>‹</button>
                <button type="button" className="pd-nav pd-next" aria-label="รูปถัดไป" onClick={() => go(1)}>›</button>
              </>
            )}
          </div>
          {n > 1 && (
            <div className="pd-thumbs">
              {paths.map((p, k) => (
                <button type="button" key={p} className={k === i ? "on" : ""} aria-label={`รูปที่ ${k + 1}`} onClick={() => setI(k)}>
                  <img src={imageUrl(p) ?? ""} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pd-body">
          {detail.brand && <b className="pd-brand">{detail.brand}</b>}
          <h3>{detail.title}</h3>
          <div className="pd-price">฿{detail.price.toLocaleString("th-TH")}</div>
          {!detail.inStock && <span className="tag">สินค้าหมดชั่วคราว</span>}
          {detail.specs.length > 0 && (
            <dl className="pd-spec">
              {detail.specs.map(([k, v]) => (
                <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>
              ))}
            </dl>
          )}
          {order && (
            <div className="pd-act">
              <a className="btn btn-brand" href={order.href} target="_blank" rel="noopener noreferrer">สั่งซื้อ</a>
              <button
                type="button"
                className={`btn btn-cart${state === "added" ? " ok" : ""}`}
                aria-label={state === "added" ? "เพิ่มแล้ว" : "เพิ่มใส่รถเข็น"}
                title="เพิ่มใส่รถเข็น"
                onClick={() => {
                  setState(cart.add(order.item) === "ok" ? "added" : "full");
                  window.setTimeout(() => setState("idle"), 1500);
                }}
              >
                {state === "added" ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                )}
              </button>
            </div>
          )}
          {state === "full" && <span className="order-hint">รถเข็นเต็ม (สูงสุด 10 รายการ)</span>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
