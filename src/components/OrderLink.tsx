"use client";

import { useState } from "react";

// ปุ่มสั่งซื้อทาง Messenger: เปิดแชทร้านพร้อมข้อความรายการสินค้า (ลูกค้ากดส่งเอง)
// และคัดลอกข้อความไว้ให้ด้วย เผื่อแอปบางเครื่องไม่เติมข้อความให้อัตโนมัติ
export default function OrderLink({ href, text, label }: { href: string; text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <a
        className="btn btn-brand"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          try { navigator.clipboard?.writeText(text).catch(() => {}); } catch { /* ไม่รองรับ ข้ามได้ */ }
          setCopied(true);
        }}
      >
        {label}
      </a>
      {copied && <small className="order-hint">คัดลอกข้อความแล้ว ถ้าในแชทไม่มีข้อความ ให้กดวางแล้วส่งได้เลย</small>}
    </>
  );
}
