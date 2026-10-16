import { getCars, getProducts, getSite } from "@/lib/supabase";
import SizeSearch from "@/components/SizeSearch";
import CategoryChips from "@/components/CategoryChips";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";
const n = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
const uuid = /^[0-9a-f-]{36}$/i;

export default async function Products({ searchParams }: {
  searchParams: Promise<{ w?: string; a?: string; r?: string; c?: string }>;
}) {
  const s = await searchParams;
  const c = s.c && uuid.test(s.c) ? s.c : undefined;
  const [{ data, error }, { categories }, cars] = await Promise.all([
    getProducts({ w: n(s.w), a: n(s.a), r: n(s.r), c }),
    getSite(),
    getCars(),
  ]);
  return (
    <>
      <div className="band" />
      <div className="wrap up">
        <SizeSearch w={s.w} a={s.a} r={s.r} cars={cars} />
        <CategoryChips items={categories} active={c ?? ""} />
      </div>
      <div className="wrap sec">
        <h1 className="sec-t">สินค้า ({data.length})</h1>
        <ProductGrid items={data} error={error} filtered={!!(s.w || s.a || s.r || c)} grouped={!c} />
      </div>
    </>
  );
}
