import { sbServer } from "@/lib/supabase-server";
import ProductsManager, { type AdminProduct } from "./ProductsManager";

export const dynamic = "force-dynamic";

type ProductRow = Omit<AdminProduct, "brand_name"> & { brands: { name: string } | null };

export default async function ProductsPage() {
  const supabase = await sbServer();
  const [products, brands, categories] = await Promise.all([
    supabase
      .from("products")
      .select("id,brand_id,name,model,width_mm,aspect_ratio,rim_inch,size_label,load_index,speed_rating,cost_price,sale_price,stock_qty,low_stock_threshold,image_path,category_id,is_active,brands(name)")
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
          <h1>สินค้า</h1>
          <p>ราคาต้นทุนและสต็อกไม่แสดงบนหน้าเว็บลูกค้า</p>
        </div>
      </div>
      <ProductsManager
        initial={items}
        brands={brands.data ?? []}
        categories={categories.data ?? []}
      />
    </>
  );
}
