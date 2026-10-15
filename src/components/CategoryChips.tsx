import Link from "next/link";
import { PRODUCT_TYPES } from "@/lib/product-meta";

// ตัวกรองประเภทสินค้าฝั่งลูกค้า: มี "ทั้งหมด" เสมอ และแสดงเฉพาะประเภทที่มีสินค้าอยู่จริง
// active: undefined = ไม่ไฮไลต์ (หน้าแรก), "" = ทั้งหมด, ค่าประเภท = ประเภทที่เลือก
export default function CategoryChips({ usedTypes, active }: { usedTypes: string[]; active?: string }) {
  const on = (v: string) => (active === v ? "on" : "");
  const types = PRODUCT_TYPES.filter((t) => usedTypes.includes(t.value));
  return (
    <div className="chips">
      <Link href="/products" className={on("")}>ทั้งหมด</Link>
      {types.map((t) => (
        <Link key={t.value} href={`/products?t=${t.value}`} className={on(t.value)}>{t.label}</Link>
      ))}
    </div>
  );
}
