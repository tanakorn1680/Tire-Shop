import { site } from "@/site.config";
import { imageUrl, type Product } from "@/lib/supabase";

export default function ProductGrid({ items, error }: { items: Product[]; error: string | null }) {
  if (error) return <p className="note">{error}</p>;
  if (!items.length) return <p className="note">ยังไม่มีสินค้าที่ตรงกับเงื่อนไข</p>;
  return (
    <div className="grid">
      {items.map((p) => {
        const img = imageUrl(p.image_path);
        return (
          <div className="card" key={p.id}>
            <div className="img">{img ? <img src={img} alt={`${p.brand_name} ${p.name}`} loading="lazy" /> : "🛞"}</div>
            <b>{p.brand_name}</b>
            <span>{p.name}{p.model ? ` ${p.model}` : ""}</span>
            <small>{p.size_label}{p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}</small>
            <div className="price">฿{Number(p.sale_price).toLocaleString("th-TH")}</div>
            {!p.in_stock && <span className="tag">สินค้าหมดชั่วคราว</span>}
            <a className="btn btn-brand" href={site.lineUrl}>สอบถามทาง LINE</a>
          </div>
        );
      })}
    </div>
  );
}
