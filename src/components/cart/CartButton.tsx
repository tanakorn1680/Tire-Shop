"use client";

import { useCart } from "./CartProvider";

// ปุ่มตะกร้าที่แถบบน (แสดงเมื่อร้านตั้งลิงก์ Messenger ไว้แล้ว)
export default function CartButton() {
  const { messenger, count, setOpen } = useCart();
  if (!messenger) return null;
  return (
    <button type="button" className="btn btn-line cart-btn" onClick={() => setOpen(true)} aria-label={`ตะกร้าสินค้า ${count} ชิ้น`}>
      ตะกร้า{count > 0 && <span className="cart-n">{count}</span>}
    </button>
  );
}
