// ค่าที่เป็นโครงสร้างของเว็บเท่านั้น
// ชื่อร้าน เบอร์ ที่อยู่ สินค้า ประเภทสินค้า บริการ ทั้งหมดมาจากฐานข้อมูล (แอดมินเป็นคนเพิ่ม)
const range = (a: number, b: number, s = 1) =>
  Array.from({ length: Math.floor((b - a) / s) + 1 }, (_, i) => a + i * s);

export const site = {
  colors: { brand: "#ffc400", dark: "#14161b" },
  // ตัวเลือกในช่องค้นหาขนาดยาง
  sizes: { width: range(145, 285, 10), aspect: range(30, 80, 5), rim: range(12, 22) },
};
