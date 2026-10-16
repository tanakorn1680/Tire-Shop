import { Fragment } from "react";
import { getSite, imageUrl, t, type Product } from "@/lib/supabase";
import { orderUrl, singleOrderText, type OrderItem } from "@/lib/order";
import CardActions from "./CardActions";

const toItem = (p: Product): Omit<OrderItem, "qty"> => ({
  id: p.id,
  name: `${p.brand_name} ${p.name}${p.model ? ` ${p.model}` : ""}`,
  category: p.category_name ?? "",
  size: p.size_label ? `${p.size_label}${p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}` : "",
  price: Number(p.sale_price),
});

export default async function ProductGrid({ items, error, filtered, grouped }: {
  items: Product[]; error: string | null; filtered?: boolean; grouped?: boolean;
}) {
  if (error) return <p className="note">{error}</p>;
  if (!items.length) return <p className="note">{filtered ? "ไม่พบสินค้าที่ตรงกับเงื่อนไข" : "ยังไม่มีสินค้า"}</p>;
  const { settings, categories } = await getSite();
  // หน้า "ทั้งหมด": เรียงเป็นกลุ่มตามประเภท (ลำดับในกลุ่มคงเดิม) และบนมือถือมีหัวข้อคั่นแต่ละประเภท
  const rank = new Map(categories.map((c, i) => [c.id, i]));
  const rk = (p: Product) => (p.category_id ? rank.get(p.category_id) ?? categories.length : categories.length);
  const list = grouped ? [...items].sort((a, b) => rk(a) - rk(b)) : items;
  const heads = !!grouped && new Set(list.map((p) => p.category_id)).size > 1;
  const messenger = t(settings.messenger_url);
  return (
    <div className="grid">
      {list.map((p, i) => {
        const img = imageUrl(p.image_path);
        const item = toItem(p);
        return (
          <Fragment key={p.id}>
          {heads && (i === 0 || p.category_id !== list[i - 1].category_id) && <h2 className="cat-h">{p.category_name ?? "อื่นๆ"}</h2>}
          <div className="card">
            <div className="img">{img && <img src={img} alt={`${p.brand_name} ${p.name}`} loading="lazy" />}</div>
            <b className="brand">{p.brand_name}</b>
            <span>{p.name}{p.model ? ` ${p.model}` : ""}</span>
            <small>{p.size_label}{p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}</small>
            <div className="price">฿{Number(p.sale_price).toLocaleString("th-TH")}</div>
            {!p.in_stock && <span className="tag">สินค้าหมดชั่วคราว</span>}
            {p.in_stock && messenger && (
              <CardActions item={item} href={orderUrl(messenger, singleOrderText({ ...item, qty: 1 }))} />
            )}
          </div>
          </Fragment>
        );
      })}
    </div>
  );
}
