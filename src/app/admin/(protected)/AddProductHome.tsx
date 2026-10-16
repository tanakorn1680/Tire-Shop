"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, Named } from "@/lib/product-meta";
import { useBackOverride } from "@/components/admin/AdminShell";
import ProductForm from "./products/ProductForm";

// หน้าหลัก: ปุ่มเดียว "+ เพิ่มสินค้า" กดแล้วแสดงฟอร์มในหน้านี้เลย (ไม่เปลี่ยนหน้า)
export default function AddProductHome({ brands, categories, canDelete, children }: { brands: Named[]; categories: Category[]; canDelete: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useBackOverride(open, () => { setOpen(false); window.scrollTo(0, 0); }); // ปุ่มย้อนกลับด้านบน = ปิดฟอร์มกลับหน้าหลัก

  if (open) {
    return (
      <ProductForm
        product={null}
        brands={brands}
        categories={categories}
        canDelete={canDelete}
        onDone={(saved) => {
          setOpen(false);
          window.scrollTo(0, 0);
          if (saved) router.refresh();
        }}
      />
    );
  }

  return (
    <>
      <div className="adm-pg-hd">
        <div>
          <h1>หน้าหลัก</h1>
          <p>ภาพรวมสินค้าและสต็อกของร้าน</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => { setOpen(true); window.scrollTo(0, 0); }}
          >
            + เพิ่มสินค้า
          </button>
          <Link href="/admin/services" className="btn btn-dark btn-white">+ เพิ่มบริการ</Link>
        </div>
      </div>
      {children}
    </>
  );
}
