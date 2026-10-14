import Link from "next/link";
import { site } from "@/site.config";
import { getProducts } from "@/lib/supabase";
import SizeSearch from "@/components/SizeSearch";
import ProductGrid from "@/components/ProductGrid";

export const revalidate = 60;

export default async function Home() {
  const { data, error } = await getProducts({ limit: 5 });
  return (
    <>
      <div className="wrap sec">
        <SizeSearch />
      </div>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="rowhd"><h2 className="sec-t">สินค้า</h2><Link href="/products">ดูทั้งหมด →</Link></div>
          <ProductGrid items={data} error={error} />
        </div>
      </section>
      <section className="sec svc" id="services">
        <div className="wrap">
          <h2 className="sec-t">บริการ</h2>
          <div className="svc-g">
            {site.services.map((s) => (
              <div key={s.title}><div className="ic">{s.icon}</div><b>{s.title}</b><p>{s.desc}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
