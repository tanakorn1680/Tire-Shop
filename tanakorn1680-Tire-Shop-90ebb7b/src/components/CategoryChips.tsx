import Link from "next/link";
import type { Named } from "@/lib/supabase";

// active: undefined = ไม่ไฮไลต์ (หน้าแรก), "" = ทั้งหมด, id = ประเภทที่เลือก
export default function CategoryChips({ items, active }: { items: Named[]; active?: string }) {
  const on = (id: string) => (active === id ? "on" : "");
  return (
    <div className="chips">
      <Link href="/products" className={on("")}>ทั้งหมด</Link>
      {items.map((c) => (
        <Link key={c.id} href={`/products?c=${c.id}`} className={on(c.id)}>{c.name}</Link>
      ))}
    </div>
  );
}
