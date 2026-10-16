"use client";

import { useCart } from "./CartProvider";

// ปุ่มรถเข็นที่แถบบน (แสดงเมื่อร้านตั้งลิงก์ Messenger ไว้แล้ว)
export default function CartButton() {
  const { messenger, count, setOpen } = useCart();
  if (!messenger) return null;
  return (
    <button type="button" className="btn btn-line cart-btn" onClick={() => setOpen(true)} aria-label={`รถเข็นสินค้า ${count} ชิ้น`}>
      <svg className="cart-ic" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <span className="cart-n">{count}</span>}
    </button>
  );
}
