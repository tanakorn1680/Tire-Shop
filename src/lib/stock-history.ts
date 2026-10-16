// ประวัติสต็อก: ชนิดรายการ ป้ายชื่อ และฟังก์ชันบันทึก (ตาราง stock_history ใน migration 0011)
import { sb } from "@/lib/supabase-browser";

export type HistoryAction = "add" | "increase" | "decrease" | "delete";

export const ACTION_LABEL: Record<HistoryAction, string> = {
  add: "เพิ่มสินค้าใหม่",
  increase: "เพิ่มจำนวน",
  decrease: "ลดจำนวน",
  delete: "ลบสินค้า",
};

export type HistoryRow = {
  id: string; occurred_at: string; action: HistoryAction; product_name: string;
  qty_before: number | null; qty_after: number | null; qty_change: number | null; reason: string | null;
};

// ชื่อสินค้าที่เก็บในประวัติ (เก็บเป็นข้อความ เพื่อให้ยังอ่านออกแม้สินค้าถูกลบไปแล้ว)
export const historyName = (brand: string, name: string, model?: string | null) =>
  `${brand} ${name}${model ? ` ${model}` : ""}`.trim();

// วันเวลาปัจจุบันในรูปแบบของช่อง datetime-local (เวลาเครื่อง)
export function nowLocalInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// ค่าจากช่อง datetime-local -> ISO (ไม่ถูกต้อง = null)
export function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function logHistory(e: {
  action: HistoryAction; product_id: string | null; product_name: string;
  qty_before: number | null; qty_after: number | null; reason: string | null; occurred_at: string;
}): Promise<boolean> {
  const { error } = await sb().from("stock_history").insert({
    ...e,
    qty_change: e.qty_before !== null && e.qty_after !== null ? e.qty_after - e.qty_before : null,
  });
  return !error;
}

export const HISTORY_FAIL_MSG =
  "บันทึกประวัติไม่สำเร็จ (ข้อมูลสินค้าถูกบันทึกแล้ว) ตรวจว่าได้รัน migration 0011_stock_history.sql ใน Supabase SQL Editor แล้ว";
