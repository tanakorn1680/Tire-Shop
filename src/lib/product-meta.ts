// ข้อมูลกลางของสินค้าฝั่งแอดมิน: ประเภท ป้ายชื่อ คอลัมน์ที่ดึง และฟังก์ชันช่วย (ไม่มี UI)

export type ProductType = "new_tire" | "used_tire" | "wheel";

export const PRODUCT_TYPES: { value: ProductType; label: string; unit: string }[] = [
  { value: "new_tire", label: "ยางมือหนึ่ง", unit: "เส้น" },
  { value: "used_tire", label: "ยางมือสอง", unit: "เส้น" },
  { value: "wheel", label: "ล้อแม็ก", unit: "วง" },
];

export const isProductType = (v: unknown): v is ProductType =>
  PRODUCT_TYPES.some((t) => t.value === v);
export const typeLabel = (t: ProductType) => PRODUCT_TYPES.find((x) => x.value === t)?.label ?? "";
export const typeUnit = (t: ProductType) => PRODUCT_TYPES.find((x) => x.value === t)?.unit ?? "ชิ้น";

export type AdminProduct = {
  id: string; brand_id: string; brand_name: string; name: string; model: string | null;
  sku: string | null; product_type: ProductType; is_individual: boolean; storage_location: string | null;
  width_mm: number | null; aspect_ratio: number | null; rim_inch: number | null; size_label: string | null;
  load_index: string | null; speed_rating: string | null;
  dot_week: number | null; dot_year: number | null;
  tread_depth_mm: number | null; condition_note: string | null; defect_note: string | null; repair_note: string | null;
  wheel_width_in: number | null; wheel_pcd: string | null; wheel_bolts: number | null; wheel_offset_mm: number | null;
  cost_price: number; sale_price: number; stock_qty: number; low_stock_threshold: number;
  image_path: string | null; category_id: string | null; is_active: boolean;
};
export type Named = { id: string; name: string };
// ประเภทสินค้าที่แอดมินเพิ่มเอง (เริ่มว่าง)
export type Category = Named;

// คอลัมน์ที่ดึงจากตาราง products (ใช้ซ้ำทั้งหน้ารายการและหลังบันทึก)
export const PRODUCT_COLUMNS =
  "id,brand_id,name,model,sku,product_type,is_individual,storage_location," +
  "width_mm,aspect_ratio,rim_inch,size_label,load_index,speed_rating,dot_week,dot_year," +
  "tread_depth_mm,condition_note,defect_note,repair_note," +
  "wheel_width_in,wheel_pcd,wheel_bolts,wheel_offset_mm," +
  "cost_price,sale_price,stock_qty,low_stock_threshold,image_path,category_id,is_active,brands(name)";

export const baht = (n: number | string) => Number(n).toLocaleString("th-TH");

// DOT 4 หลัก: 2 หลักแรก = สัปดาห์, 2 หลักหลัง = ปี (เช่น 2524 = สัปดาห์ 25 ปี 2024)
export function dotText(week: number | null, year: number | null): string {
  if (!week || !year) return "";
  return `${String(week).padStart(2, "0")}${String(year % 100).padStart(2, "0")}`;
}
export function parseDot(input: string): { week: number; year: number } | null | "invalid" {
  const s = input.trim();
  if (!s) return null;
  if (!/^\d{4}$/.test(s)) return "invalid";
  const week = Number(s.slice(0, 2));
  if (week < 1 || week > 53) return "invalid";
  return { week, year: 2000 + Number(s.slice(2)) };
}

// ข้อความสรุปขนาด/คุณสมบัติ ใช้ในรายการสินค้า (แสดงเฉพาะค่าที่กรอกไว้)
export function specText(p: AdminProduct): string {
  const parts = [
    p.size_label || (p.rim_inch ? `${p.rim_inch} นิ้ว` : ""),
    p.wheel_width_in ? `กว้าง ${p.wheel_width_in}` : "",
    p.wheel_bolts && p.wheel_pcd ? `${p.wheel_bolts} รู PCD ${p.wheel_pcd}` : p.wheel_pcd ? `PCD ${p.wheel_pcd}` : "",
    p.wheel_offset_mm !== null && p.wheel_offset_mm !== undefined ? `ET ${p.wheel_offset_mm}` : "",
    p.tread_depth_mm !== null && p.tread_depth_mm !== undefined ? `ดอก ${p.tread_depth_mm} มม.` : "",
    dotText(p.dot_week, p.dot_year) ? `DOT ${dotText(p.dot_week, p.dot_year)}` : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

// แปลงข้อความเป็นรูปแบบเทียบค้นหา: ตัวพิมพ์เล็ก ตัดช่องว่าง/เครื่องหมายทิ้ง ("205/55 R16" -> "20555r16")
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");

// ค้นหาจากชื่อ ยี่ห้อ รุ่น ขนาด รหัสสินค้า (พิมพ์หลายคำได้ ลำดับใดก็ได้ ต้องเจอครบทุกคำ)
export function matchesQuery(p: AdminProduct, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).map(norm).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = norm(
    [p.brand_name, p.name, p.model, p.sku, p.size_label, p.wheel_pcd, p.rim_inch ? `${p.rim_inch}` : ""]
      .filter(Boolean).join(" "),
  );
  return tokens.every((t) => hay.includes(t));
}

// หายี่ห้อที่มีอยู่แล้วจากชื่อที่พิมพ์ (ไม่สนตัวพิมพ์เล็ก/ใหญ่ และช่องว่างเกิน)
const brandKey = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
export const findBrand = (brands: Named[], typed: string): Named | undefined =>
  brands.find((b) => brandKey(b.name) === brandKey(typed));

// สินค้าที่ติดตามรายเส้นไม่ต้องแจ้งเตือน "ใกล้หมด" (มีได้แค่ 0/1)
export const isLowStock = (p: AdminProduct) =>
  p.is_active && !p.is_individual && p.stock_qty <= p.low_stock_threshold;
