"use client";

import { useState } from "react";
import { useCart } from "./cart/CartProvider";
import type { OrderItem } from "@/lib/order";

// ปุ่มในการ์ดสินค้า: สั่งซื้อ (เปิดแชทพร้อมข้อความ ลูกค้ากดส่งเอง) และเพิ่มใส่รถเข็น
export default function CardActions({ item, href }: { item: Omit<OrderItem, "qty">; href: string }) {
  const cart = useCart();
  const [state, setState] = useState<"idle" | "added" | "full">("idle");
  return (
    <div className="card-act">
      <a className="btn btn-brand" href={href} target="_blank" rel="noopener noreferrer">สั่งซื้อ</a>
      <button
        type="button"
        className="btn btn-out"
        onClick={() => {
          setState(cart.add(item) === "ok" ? "added" : "full");
          window.setTimeout(() => setState("idle"), 1500);
        }}
      >
        {state === "added" ? "เพิ่มแล้ว" : state === "full" ? "รถเข็นเต็ม (สูงสุด 10 รายการ)" : "เพิ่มใส่รถเข็น"}
      </button>
    </div>
  );
}
