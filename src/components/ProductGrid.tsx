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
        const item = toItem(p);
        return (
          <div className="card" key={p.id}>
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
        );
      })}
    </div>
  );
}
