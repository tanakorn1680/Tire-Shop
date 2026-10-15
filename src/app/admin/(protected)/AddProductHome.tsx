"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Named } from "@/lib/product-meta";
import ProductForm from "./products/ProductForm";

// หน้าหลัก: ปุ่มเดียว "+ เพิ่มสินค้า" กดแล้วแสดงฟอร์มในหน้านี้เลย (ไม่เปลี่ยนหน้า)
export default function AddProductHome({ brands, categories, children }: { brands: Named[]; categories: Category[]; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <ProductForm
        product={null}
        brands={brands}
        categories={categories}
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
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => { setOpen(true); window.scrollTo(0, 0); }}
        >
          + เพิ่มสินค้า
        </button>
      </div>
      {children}
    </>
  );
}
