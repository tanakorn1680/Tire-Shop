import Link from "next/link";

type Step = { label: string; done: boolean };

// กล่องแดงเตือนด้วยสัญลักษณ์ + ข้อความสั้นที่หน้าหลักแอดมิน: แสดงเฉพาะตอนที่ยังไม่ได้ตั้งค่าร้านเลยสักช่อง (กรอกอย่างน้อย 1 ช่องแล้วจะไม่แสดง) กดแล้วไปหน้าตั้งค่า
export default function SetupCard({ steps }: { steps: Step[] }) {
  if (steps.some((s) => s.done)) return null;
  return (
    <Link href="/admin/settings" className="adm-warn-box" aria-label="ยังไม่ได้ตั้งค่าร้าน กดเพื่อไปตั้งค่า" title="ยังไม่ได้ตั้งค่าร้าน">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 20h20L12 3zM12 10v4M12 17h.01" /></svg>
      <span className="adm-warn-txt"><b>ยังไม่ได้ตั้งค่าร้าน</b><small>กดที่นี่เพื่อตั้งค่า</small></span>
      <svg className="adm-warn-go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
    </Link>
  );
}
