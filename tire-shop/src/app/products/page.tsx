import { getProducts } from "@/lib/supabase";
import SizeSearch from "@/components/SizeSearch";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";
const n = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

export default async function Products({ searchParams }: { searchParams: Promise<{ w?: string; a?: string; r?: string }> }) {
  const s = await searchParams;
  const { data, error } = await getProducts({ w: n(s.w), a: n(s.a), r: n(s.r) });
  return (
    <div className="wrap sec">
      <SizeSearch w={s.w} a={s.a} r={s.r} />
      <h1 className="sec-t" style={{ marginTop: 28 }}>สินค้า ({data.length})</h1>
      <ProductGrid items={data} error={error} />
    </div>
  );
}
