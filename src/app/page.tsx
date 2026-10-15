import Link from "next/link";
import { getProducts, getSite } from "@/lib/supabase";
import SizeSearch from "@/components/SizeSearch";
import CategoryChips from "@/components/CategoryChips";
import ProductGrid from "@/components/ProductGrid";

export const revalidate = 60;

export default async function Home() {
  const [{ data, error }, { usedTypes, services }] = await Promise.all([getProducts({ limit: 8 }), getSite()]);
  return (
    <>
      <div className="band" />
      <div className="wrap up">
        <SizeSearch />
        <CategoryChips usedTypes={usedTypes} />
      </div>
      <section className="sec">
        <div className="wrap">
          <div className="rowhd"><h2 className="sec-t">สินค้า</h2><Link href="/products">ดูทั้งหมด</Link></div>
          <ProductGrid items={data} error={error} />
        </div>
      </section>
      {services.length > 0 && (
        <section className="sec svc" id="services">
          <div className="wrap">
            <h2 className="sec-t">บริการ</h2>
            <div className="svc-g">
              {services.map((s) => (
                <div className="svc-i" key={s.id}>
                  <span className="dot" />
                  <div><b>{s.name}</b>{s.description && <p>{s.description}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
