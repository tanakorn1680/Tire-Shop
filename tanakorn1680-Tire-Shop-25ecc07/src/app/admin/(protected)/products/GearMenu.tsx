"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ปุ่มตั้งค่าเล็กๆ: ไปหน้าเพิ่ม/ลบประเภทสินค้าและยี่ห้อ (newTab = เปิดแท็บใหม่ เพื่อไม่ให้ข้อมูลที่กรอกค้างในฟอร์มหาย)
export default function GearMenu({ newTab = false, style }: { newTab?: boolean; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const t = newTab ? { target: "_blank", rel: "noopener" } : {};
  return (
    <div className="adm-gear" ref={box} style={style}>
      <button type="button" className="adm-gear-btn" aria-label="ตั้งค่าประเภทสินค้าและยี่ห้อ" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
      {open && (
        <div className="adm-gear-pop">
          <Link href="/admin/categories" {...t}>เพิ่ม/ลบประเภทสินค้า</Link>
          <Link href="/admin/brands" {...t}>เพิ่ม/ลบยี่ห้อ</Link>
        </div>
      )}
    </div>
  );
}
