import { getProducts, getSite } from "@/lib/supabase";
import SizeSearch from "@/components/SizeSearch";
import CategoryChips from "@/components/CategoryChips";
import { isProductType } from "@/lib/product-meta";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";
const n = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

export default async function Products({ searchParams }: {
  searchParams: Promise<{ w?: string; a?: string; r?: string; t?: string }>;
}) {
  const s = await searchParams;
  const t = isProductType(s.t) ? s.t : undefined;
  const [{ data, error }, { usedTypes }] = await Promise.all([
    getProducts({ w: n(s.w), a: n(s.a), r: n(s.r), t }),
    getSite(),
  ]);
  return (
    <>
      <div className="band" />
      <div className="wrap up">
        <SizeSearch w={s.w} a={s.a} r={s.r} />
        <CategoryChips usedTypes={usedTypes} active={t ?? ""} />
      </div>
      <div className="wrap sec">
        <h1 className="sec-t">สินค้า ({data.length})</h1>
        <ProductGrid items={data} error={error} filtered={!!(s.w || s.a || s.r || t)} />
      </div>
    </>
  );
}
