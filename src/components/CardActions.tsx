"use client";

import { useState } from "react";
import { useCart } from "./cart/CartProvider";
import ProductDetail, { type Detail } from "./ProductDetail";
import type { OrderItem } from "@/lib/order";

// ปุ่มในการ์ดสินค้า: สั่งซื้อ (เปิดแชทพร้อมข้อความ ลูกค้ากดส่งเอง) / ไอคอนรถเข็น (เพิ่มใส่รถเข็น) / ไอคอน 3 จุด (ดูรายละเอียดสินค้า)
// canOrder = false เมื่อสินค้าหมดหรือร้านยังไม่ตั้งลิงก์ Messenger → เหลือแต่ปุ่ม 3 จุด
export default function CardActions({ item, href, detail, canOrder }: {
  item: Omit<OrderItem, "qty">; href: string; detail: Detail; canOrder: boolean;
}) {
  const cart = useCart();
  const [state, setState] = useState<"idle" | "added" | "full">("idle");
  const [open, setOpen] = useState(false);
  return (
    <div className="card-act">
      {canOrder && (
        <>
          <a className="btn btn-brand" href={href} target="_blank" rel="noopener noreferrer">สั่งซื้อ</a>
          <button
            type="button"
            className={`btn btn-cart${state === "added" ? " ok" : ""}`}
            aria-label={state === "added" ? "เพิ่มแล้ว" : "เพิ่มใส่รถเข็น"}
            title="เพิ่มใส่รถเข็น"
            onClick={() => {
              setState(cart.add(item) === "ok" ? "added" : "full");
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
        </>
      )}
      <button type="button" className="btn btn-more" aria-label="ดูรายละเอียดสินค้า" title="ดูรายละเอียด" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
      </button>
      {state === "full" && <span className="order-hint">รถเข็นเต็ม (สูงสุด 10 รายการ)</span>}
      {open && <ProductDetail detail={detail} order={canOrder ? { item, href } : null} onClose={() => setOpen(false)} />}
    </div>
  );
}
