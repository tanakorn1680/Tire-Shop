import Link from "next/link";

type Step = { label: string; done: boolean };

// แจ้งเตือนง่ายๆ ที่หน้าหลักแอดมิน: แสดงเฉพาะตอนที่ยังไม่ได้ตั้งค่าร้านเลยสักช่อง (กรอกอย่างน้อย 1 ช่องแล้วจะไม่แสดง) กดแล้วไปหน้าตั้งค่า
export default function SetupCard({ steps }: { steps: Step[] }) {
  if (steps.some((s) => s.done)) return null;
  return (
    <Link href="/admin/settings" className="adm-setup warn">
      <span className="adm-setup-ic" aria-hidden="true">!</span>
      <div className="adm-setup-tx">
        <h2>แจ้งเตือน!</h2>
        <p>ยังไม่ได้ตั้งค่าร้าน กดเพื่อไปตั้งค่า</p>
      </div>
    </Link>
  );
}
