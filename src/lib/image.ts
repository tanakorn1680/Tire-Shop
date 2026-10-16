// ย่อรูปจากกล้อง/แกลเลอรี่มือถือก่อนอัปโหลด (ด้านยาวไม่เกิน 1600px) และแปลงเป็น JPEG
// ให้ผ่านข้อกำหนดของที่เก็บรูป (JPG/PNG/WEBP ไม่เกิน 5 MB) รูปที่เล็กอยู่แล้วจะส่งตามเดิม
const OK = ["image/jpeg", "image/png", "image/webp"];

export async function shrinkImage(file: File): Promise<Blob> {
  const small = OK.includes(file.type) && file.size <= 1_500_000;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && small) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) throw new Error("encode");
    return blob;
  } catch (e) {
    if (OK.includes(file.type) && file.size <= 5_000_000) return file;
    throw e;
  }
}
