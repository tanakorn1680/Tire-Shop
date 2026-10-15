// ตัวช่วยเรื่องลิงก์ (ใช้ทั้งหน้าตั้งค่าร้านและหน้าเว็บลูกค้า)

// ทำให้เป็นลิงก์ที่ใช้ได้: ไม่มี http(s):// ให้เติม https:// ให้ ถ้าไม่ใช่ลิงก์คืน null
export function normalizeUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v) ? `https://${v}` : "";
  if (!withScheme) return null;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

// ลิงก์เปิดแชท Messenger พร้อมข้อความที่พิมพ์รอไว้ในช่องแชท (ลูกค้ากดส่งเอง)
export function messengerOrderUrl(base: string, text: string): string {
  const b = base.split("#")[0];
  return `${b}${b.includes("?") ? "&" : "?"}text=${encodeURIComponent(text)}`;
}
