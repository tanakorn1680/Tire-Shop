import { getSite, imageUrl, t, type Product } from "@/lib/supabase";
import { messengerOrderUrl } from "@/lib/links";
import OrderLink from "./OrderLink";

// ข้อความที่ส่งเข้าแชท: สั้น อ่านง่ายทั้งลูกค้าและร้าน มีชื่อสินค้า ขนาด ราคา จำนวน
function orderText(p: Product): string {
  const price = Number(p.sale_price).toLocaleString("th-TH");
  const size = p.size_label ? `${p.size_label}${p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}` : "";
  const detail = [
    p.category_name ? `ประเภท: ${p.category_name}` : "",
    `สินค้า: ${p.brand_name} ${p.name}${p.model ? ` ${p.model}` : ""}`,
    size ? `ขนาด: ${size}` : "",
    `ราคา: ${price} บาท`,
    "จำนวน: 1",
  ].filter(Boolean).join("\n");
  return `สนใจสั่งซื้อสินค้านี้\n\n${detail}`;
}

export default async function ProductGrid({ items, error, filtered }: {
  items: Product[]; error: string | null; filtered?: boolean;
}) {
  if (error) return <p className="note">{error}</p>;
  if (!items.length) return <p className="note">{filtered ? "ไม่พบสินค้าที่ตรงกับเงื่อนไข" : "ยังไม่มีสินค้า"}</p>;
  const { settings } = await getSite();
  const messenger = t(settings.messenger_url);
  return (
    <div className="grid">
      {items.map((p) => {
        const img = imageUrl(p.image_path);
        const text = orderText(p);
        return (
          <div className="card" key={p.id}>
            <div className="img">{img && <img src={img} alt={`${p.brand_name} ${p.name}`} loading="lazy" />}</div>
            <b className="brand">{p.brand_name}</b>
            <span>{p.name}{p.model ? ` ${p.model}` : ""}</span>
            <small>{p.size_label}{p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}</small>
            <div className="price">฿{Number(p.sale_price).toLocaleString("th-TH")}</div>
            {!p.in_stock && <span className="tag">สินค้าหมดชั่วคราว</span>}
            {p.in_stock && messenger && (
              <div className="card-act">
                <OrderLink href={messengerOrderUrl(messenger, text)} text={text} label="สั่งซื้อ" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
