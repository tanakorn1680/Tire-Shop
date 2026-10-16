"use client";

import { useState } from "react";
import { useCart } from "./cart/CartProvider";
import type { OrderItem } from "@/lib/order";

// ปุ่มในการ์ดสินค้า: สั่งซื้อ (เปิดแชทพร้อมข้อความ ลูกค้ากดส่งเอง) และปุ่มไอคอนรถเข็น (เพิ่มใส่รถเข็น)
export default function CardActions({ item, href }: { item: Omit<OrderItem, "qty">; href: string }) {
  const cart = useCart();
  const [state, setState] = useState<"idle" | "added" | "full">("idle");
  return (
    <div className="card-act">
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
      {state === "full" && <span className="order-hint">รถเข็นเต็ม (สูงสุด 10 รายการ)</span>}
    </div>
  );
}
