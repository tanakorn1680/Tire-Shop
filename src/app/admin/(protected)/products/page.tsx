import { getAdminUser, sbServer } from "@/lib/supabase-server";
import { isProductType, PRODUCT_COLUMNS, type AdminProduct } from "@/lib/product-meta";
import ProductsManager from "./ProductsManager";

export const dynamic = "force-dynamic";

type ProductRow = Omit<AdminProduct, "brand_name"> & { brands: { name: string } | null };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const { role } = await getAdminUser();
  const supabase = await sbServer();
  const [products, brands, categories] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false })
      .returns<ProductRow[]>(),
    supabase.from("brands").select("id,name").order("name"),
    supabase.from("categories").select("id,name").order("sort_order").order("name"),
  ]);

  const items: AdminProduct[] = (products.data ?? []).map(({ brands, ...p }) => ({
    ...p,
    brand_name: brands?.name ?? "",
  }));

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>สินค้าและสต็อก</h1>
          <p>ราคาต้นทุนและจำนวนสต็อกจริงไม่แสดงบนหน้าเว็บลูกค้า</p>
        </div>
      </div>
      {products.error ? (
        <p className="adm-msg err">
          โหลดสินค้าไม่สำเร็จ — ถ้าเพิ่งอัปเดตโค้ด ให้รัน migration 0004_product_types.sql ใน Supabase SQL Editor ก่อน
          (ข้อมูลเดิมยังอยู่ครบ ไม่ได้หายไป)
        </p>
      ) : (
        <ProductsManager
          initial={items}
          brands={brands.data ?? []}
          categories={categories.data ?? []}
          canDelete={role === "owner"}
          initialTab={isProductType(type) ? type : "all"}
        />
      )}
    </>
  );
}
