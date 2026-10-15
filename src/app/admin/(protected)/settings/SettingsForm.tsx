"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

type Settings = {
  store_name?: string | null; tagline?: string | null; phone?: string | null;
  hours?: string | null; address?: string | null; line_url?: string | null;
};

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    store_name: initial.store_name ?? "",
    tagline: initial.tagline ?? "",
    phone: initial.phone ?? "",
    hours: initial.hours ?? "",
    address: initial.address ?? "",
    line_url: initial.line_url ?? "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
    );
    const { error } = await sb().from("store_settings").update(payload).eq("id", 1);
    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" });
      return;
    }
    setMsg({ ok: true, text: "บันทึกแล้ว" });
    router.refresh();
  }

  return (
    <form className="adm-card adm-form" onSubmit={onSubmit}>
      <div className="adm-f-row">
        <label className="adm-f">ชื่อร้าน
          <input value={form.store_name} onChange={(e) => set("store_name", e.target.value)} placeholder="เช่น ร้านยางสมชาย" />
        </label>
        <label className="adm-f">คำโปรย
          <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="เช่น ยางแท้ ราคาคุ้ม" />
        </label>
      </div>
      <div className="adm-f-row">
        <label className="adm-f">เบอร์โทร
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="เช่น 081-234-5678" />
        </label>
        <label className="adm-f">เวลาเปิด-ปิด
          <input value={form.hours} onChange={(e) => set("hours", e.target.value)} placeholder="เช่น จันทร์-เสาร์ 8:00-18:00" />
        </label>
      </div>
      <label className="adm-f">ที่อยู่
        <textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="ที่อยู่ร้าน" />
      </label>
      <label className="adm-f">ลิงก์ LINE
        <input value={form.line_url} onChange={(e) => set("line_url", e.target.value)} placeholder="https://line.me/..." />
      </label>
      {msg && <p className={`adm-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}
      <div className="adm-actions">
        <button className="btn btn-dark" type="submit" disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
