import Link from "next/link";

type Step = { label: string; done: boolean };

// การ์ดความคืบหน้าการตั้งค่าร้านที่หน้าหลักแอดมิน (แสดงเมื่อยังกรอกไม่ครบ กดแล้วไปหน้าตั้งค่า)
export default function SetupCard({ steps }: { steps: Step[] }) {
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  if (done >= total) return null;
  const missing = steps.filter((s) => !s.done).map((s) => s.label);
  const C = 2 * Math.PI * 28;
  return (
    <Link href="/admin/settings" className="adm-setup">
      <div className="adm-ring" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <circle className="trk" cx="32" cy="32" r="28" />
          <circle className="prg" cx="32" cy="32" r="28" strokeDasharray={`${(C * done) / total} ${C}`} />
        </svg>
        <b>{done}/{total}</b>
      </div>
      <div className="adm-setup-tx">
        <h2>ตั้งค่าร้านของคุณ</h2>
        <p>{done === 0 ? "ยินดีต้อนรับ เริ่มตั้งค่าร้านของคุณได้เลย" : done === total - 1 ? "คุณดำเนินการเกือบเสร็จแล้ว…" : "ตั้งค่าร้านให้ครบเพื่อเริ่มใช้งาน"}</p>
        <small>ยังไม่ได้กรอก: {missing.join(", ")}</small>
      </div>
    </Link>
  );
}
