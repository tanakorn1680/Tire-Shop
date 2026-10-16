import { Fragment } from "react";
import { getSite, imageUrl, t, type Product } from "@/lib/supabase";
import { orderUrl, singleOrderText, type OrderItem } from "@/lib/order";
import CardActions from "./CardActions";
import { dotText } from "@/lib/product-meta";

const toItem = (p: Product): Omit<OrderItem, "qty"> => ({
  id: p.id,
  name: `${p.brand_name} ${p.name}${p.model ? ` ${p.model}` : ""}`,
  category: p.category_name ?? "",
  size: p.size_label ? `${p.size_label}${p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}` : "",
  price: Number(p.sale_price),
});

// ข้อมูลที่แสดงในหน้าต่างรายละเอียดสินค้า (แสดงเฉพาะข้อมูลที่มีจริง)
function specsOf(p: Product): [string, string][] {
  const s: [string, string][] = [];
  if (p.category_name) s.push(["ประเภท", p.category_name]);
  if (p.model) s.push(["รุ่น", p.model]);
  if (p.size_label) s.push(["ขนาด", p.size_label]);
  else if (p.rim_inch) s.push(["ขนาดล้อ", `${p.rim_inch} นิ้ว`]);
  if (p.load_index) s.push(["ดัชนีน้ำหนัก/ความเร็ว", `${p.load_index}${p.speed_rating ?? ""}`]);
  if (p.wheel_width_in) s.push(["ความกว้างล้อ", `${p.wheel_width_in} นิ้ว`]);
  if (p.wheel_pcd) s.push(["รูน็อต / PCD", `${p.wheel_bolts ? `${p.wheel_bolts} รู ` : ""}${p.wheel_pcd}`]);
  if (p.wheel_offset_mm !== null && p.wheel_offset_mm !== undefined) s.push(["Offset (ET)", String(p.wheel_offset_mm)]);
  if (p.tread_depth_mm !== null && p.tread_depth_mm !== undefined) s.push(["ความลึกดอกยาง", `${p.tread_depth_mm} มม.`]);
  const dot = dotText(p.dot_week ?? null, p.dot_year ?? null);
  if (dot) s.push(["DOT", dot]);
  if (p.condition_note) s.push(["สภาพสินค้า", p.condition_note]);
  return s;
}

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
            <CardActions
              item={item}
              href={messenger ? orderUrl(messenger, singleOrderText({ ...item, qty: 1 })) : ""}
              canOrder={p.in_stock && !!messenger}
              detail={{
                id: p.id, brand: p.brand_name, title: `${p.name}${p.model ? ` ${p.model}` : ""}`,
                price: Number(p.sale_price), inStock: p.in_stock, coverPath: p.image_path, specs: specsOf(p),
              }}
            />
          </div>
          </Fragment>
        );
      })}
    </div>
  );
}
