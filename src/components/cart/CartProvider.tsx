"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { OrderItem } from "@/lib/order";
import { cartOrderText, orderUrl } from "@/lib/order";

const KEY = "tire-cart-v1";
const MAX_ITEMS = 10; // จำกัดจำนวนรายการ เพื่อให้ข้อความที่ส่งเข้าแชทไม่ยาวเกินลิงก์จะรับได้
const MAX_QTY = 99;

type Add = Omit<OrderItem, "qty">;
type Cart = {
  items: OrderItem[]; count: number; total: number; messenger: string;
  add: (i: Add) => "ok" | "full";
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean; setOpen: (v: boolean) => void;
};

const Ctx = createContext<Cart | null>(null);
export function useCart(): Cart {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart ต้องอยู่ใน CartProvider");
  return c;
}

export default function CartProvider({ messenger, children }: { messenger: string; children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  // โหลดตะกร้าที่เก็บไว้ในเครื่อง (ไม่ขึ้นกับการล็อกอิน ไม่ส่งไปที่ไหน)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(raw)) {
        setItems(raw.filter((x) => x && typeof x.id === "string" && Number.isFinite(x.price) && x.qty > 0).slice(0, MAX_ITEMS));
      }
    } catch { /* ใช้ตะกร้าว่าง */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* เก็บไม่ได้ ข้าม */ }
  }, [items, loaded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const add = useCallback((i: Add): "ok" | "full" => {
    let result: "ok" | "full" = "ok";
    setItems((xs) => {
      const at = xs.findIndex((x) => x.id === i.id);
      if (at >= 0) return xs.map((x, n) => (n === at ? { ...x, qty: Math.min(MAX_QTY, x.qty + 1) } : x));
      if (xs.length >= MAX_ITEMS) { result = "full"; return xs; }
      return [...xs, { ...i, qty: 1 }];
    });
    return result;
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : x)));
  }, []);
  const remove = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Cart>(() => ({
    items, messenger, add, setQty, remove, clear, open, setOpen,
    count: items.reduce((n, i) => n + i.qty, 0),
    total: items.reduce((n, i) => n + i.price * i.qty, 0),
  }), [items, messenger, add, setQty, remove, clear, open]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {open && <CartPanel />}
    </Ctx.Provider>
  );
}

function CartPanel() {
  const { items, total, messenger, setQty, remove, clear, setOpen } = useCart();
  const close = () => setOpen(false);
  return (
    <div className="cart-back" onClick={close}>
      <aside className="cart" role="dialog" aria-modal="true" aria-label="รถเข็นสินค้า" onClick={(e) => e.stopPropagation()}>
        <div className="cart-hd">
          <b>รถเข็นสินค้า</b>
          <button type="button" className="cart-x" onClick={close}>ปิด</button>
        </div>
        {items.length === 0 ? (
          <p className="note" style={{ margin: 16 }}>ยังไม่มีสินค้าในรถเข็น</p>
        ) : (
          <>
            <div className="cart-list">
              {items.map((i) => (
                <div className="cart-row" key={i.id}>
                  <div className="cart-info">
                    <b>{i.name}</b>
                    <small>{[i.size, `฿${i.price.toLocaleString("th-TH")}`].filter(Boolean).join(" · ")}</small>
                  </div>
                  <div className="cart-qty">
                    <button type="button" aria-label="ลดจำนวน" onClick={() => setQty(i.id, i.qty - 1)} disabled={i.qty <= 1}>−</button>
                    <span>{i.qty}</span>
                    <button type="button" aria-label="เพิ่มจำนวน" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                  </div>
                  <button type="button" className="cart-del" onClick={() => remove(i.id)}>ลบ</button>
                </div>
              ))}
            </div>
            <div className="cart-ft">
              <div className="cart-sum"><span>ยอดรวม</span><b>฿{total.toLocaleString("th-TH")}</b></div>
              <a className="btn btn-brand" href={orderUrl(messenger, cartOrderText(items))} target="_blank" rel="noopener noreferrer">สั่งซื้อ</a>
              <button type="button" className="cart-clear" onClick={clear}>ล้างรถเข็น</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
