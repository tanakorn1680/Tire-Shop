// ===== แก้ข้อมูลร้านทั้งหมดที่ไฟล์นี้ไฟล์เดียว =====
const range = (a: number, b: number, s = 1) =>
  Array.from({ length: Math.floor((b - a) / s) + 1 }, (_, i) => a + i * s);

export const site = {
  name: "ร้านยางบ้านเรา",
  tagline: "ยางดี บริการด้วยใจ",
  phone: "081-234-5678", // ตัวอย่าง: แก้เป็นเบอร์จริง
  hours: "เปิดบริการ 08:00 - 20:00 น.",
  address: "123 หมู่ 1 ต.บางครก อ.เมือง จ.นครปฐม 73000", // ตัวอย่าง: แก้เป็นที่อยู่จริง
  lineUrl: "https://line.me/ti/p/~your-line-id", // แก้เป็นลิงก์ LINE จริง
  colors: { brand: "#ffc400", dark: "#14161b" },
  nav: [
    { label: "หน้าแรก", href: "/" },
    { label: "สินค้า", href: "/products" },
    { label: "บริการ", href: "/#services" },
    { label: "ติดต่อ", href: "#contact" },
  ],
  services: [
    { icon: "🛞", title: "เปลี่ยนยาง", desc: "เปลี่ยนยางรถยนต์และมอเตอร์ไซค์" },
    { icon: "⚙️", title: "ถ่วงล้อ", desc: "ถ่วงล้อรถยนต์" },
    { icon: "🎯", title: "ตั้งศูนย์", desc: "ตั้งศูนย์ล้อรถยนต์" },
    { icon: "✅", title: "ตรวจเช็คฟรี", desc: "ตรวจสภาพยางและดอกยาง" },
  ],
  // ตัวเลือกในช่องค้นหาขนาดยาง
  sizes: { width: range(145, 285, 10), aspect: range(30, 80, 5), rim: range(12, 22) },
};
