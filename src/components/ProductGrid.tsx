import { getSite, imageUrl, t, type Product } from "@/lib/supabase";

export default async function ProductGrid({ items, error, filtered }: {
  items: Product[]; error: string | null; filtered?: boolean;
}) {
  if (error) return <p className="note">{error}</p>;
  if (!items.length) return <p className="note">{filtered ? "ไม่พบสินค้าที่ตรงกับเงื่อนไข" : "ยังไม่มีสินค้า"}</p>;
  const line = t((await getSite()).settings.line_url);
  return (
    <div className="grid">
      {items.map((p) => {
        const img = imageUrl(p.image_path);
        return (
          <div className="card" key={p.id}>
            <div className="img">{img && <img src={img} alt={`${p.brand_name} ${p.name}`} loading="lazy" />}</div>
            <b className="brand">{p.brand_name}</b>
            <span>{p.name}{p.model ? ` ${p.model}` : ""}</span>
            <small>{p.size_label}{p.load_index ? ` ${p.load_index}${p.speed_rating ?? ""}` : ""}</small>
            <div className="price">฿{Number(p.sale_price).toLocaleString("th-TH")}</div>
            {!p.in_stock && <span className="tag">สินค้าหมดชั่วคราว</span>}
            {line && <a className="btn btn-brand" href={line}>สอบถามทาง LINE</a>}
          </div>
        );
      })}
    </div>
  );
}
