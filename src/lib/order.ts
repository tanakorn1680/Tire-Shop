import { messengerOrderUrl } from "./links";

// ข้อความสั่งซื้อที่ส่งเข้าแชท Messenger: เรียบง่าย อ่านง่ายทั้งลูกค้าและร้าน
export type OrderItem = { id: string; name: string; category: string; size: string; price: number; qty: number };

const baht = (n: number) => `${n.toLocaleString("th-TH")} บาท`;

const lines = (i: OrderItem) =>
  [
    i.category ? `ประเภท: ${i.category}` : "",
    `สินค้า: ${i.name}`,
    i.size ? `ขนาด: ${i.size}` : "",
    `ราคา: ${baht(i.price)}`,
    `จำนวน: ${i.qty}`,
  ].filter(Boolean).join("\n");

// สั่งซื้อสินค้าชิ้นเดียวจากการ์ดสินค้า
export const singleOrderText = (i: OrderItem) => `สนใจสั่งซื้อสินค้านี้\n\n${lines(i)}`;

// สั่งซื้อทั้งตะกร้า
export function cartOrderText(items: OrderItem[]): string {
  const blocks = items.map((i, n) => `รายการที่ ${n + 1}\n${lines(i)}`).join("\n\n");
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return `สนใจสั่งซื้อสินค้า ${items.length} รายการ\n\n${blocks}\n\nรวมทั้งหมด: ${baht(total)}`;
}

export const orderUrl = (messenger: string, text: string) => messengerOrderUrl(messenger, text);
