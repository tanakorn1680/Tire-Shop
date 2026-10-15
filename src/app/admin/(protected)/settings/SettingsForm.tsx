"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";
import { normalizeUrl } from "@/lib/links";

type Settings = {
  store_name?: string | null; tagline?: string | null; phone?: string | null;
  hours?: string | null; address?: string | null; line_url?: string | null;
  facebook_url?: string | null; messenger_url?: string | null;
};

// อ่านลิงก์จากรูป QR Code (ทำงานในเครื่อง ไม่ส่งรูปไปที่ไหน ไม่มีค่าใช้จ่าย)
async function readQr(file: File): Promise<string | null> {
  const bmp = await createImageBitmap(file);
  const { default: jsQR } = await import("jsqr");
  for (const max of [1200, 2400]) {
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    const r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
    if (r?.data) return r.data;
  }
  return null;
}

// ช่องกรอกลิงก์ + ปุ่มใช้รูป QR Code แปลงเป็นลิงก์ให้อัตโนมัติ
function LinkField({ id, label, value, onChange, placeholder, hint, required }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  placeholder: string; hint?: string; required?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setNote(null);
    try {
      const data = await readQr(file);
      const link = data ? normalizeUrl(data) : null;
      if (!data) setNote({ ok: false, text: "อ่าน QR Code ไม่ได้ ลองรูปที่ชัดและเห็น QR เต็มรูป หรือวางลิงก์เอง" });
      else if (!link) setNote({ ok: false, text: "QR Code นี้ไม่ใช่ลิงก์ ลองรูป QR อื่น หรือวางลิงก์เอง" });
      else { onChange(link); setNote({ ok: true, text: "อ่าน QR Code แล้ว ใส่ลิงก์ให้เรียบร้อย" }); }
    } catch {
      setNote({ ok: false, text: "เปิดรูปนี้ไม่ได้ ลองรูปอื่น หรือวางลิงก์เอง" });
    }
    setBusy(false);
  }

  return (
    <div className="adm-f">
      <label htmlFor={id}>{label}{required ? " *" : ""}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode="url" autoComplete="off" />
      <div style={{ marginTop: 8 }}>
        <label className="btn btn-ghost btn-sm" style={{ cursor: busy ? "default" : "pointer" }}>
          {busy ? "กำลังอ่านรูป..." : "ใช้รูป QR Code"}
          <input type="file" accept="image/*" onChange={onPick} disabled={busy} style={{ display: "none" }} />
        </label>
      </div>
      {note ? <span className={`adm-hint`} style={{ color: note.ok ? undefined : "#b42318" }}>{note.text}</span> : hint && <span className="adm-hint">{hint}</span>}
    </div>
  );
}

export default function SettingsForm({ initial, needMigration = false }: { initial: Settings; needMigration?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    store_name: initial.store_name ?? "",
    tagline: initial.tagline ?? "",
    phone: initial.phone ?? "",
    hours: initial.hours ?? "",
    address: initial.address ?? "",
    line_url: initial.line_url ?? "",
    facebook_url: initial.facebook_url ?? "",
    messenger_url: initial.messenger_url ?? "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (needMigration) {
      setMsg({ ok: false, text: "ยังบันทึกไม่ได้ ต้องรัน migration 0006_social_links.sql ใน Supabase SQL Editor ก่อน" });
      return;
    }
    // ลิงก์ Messenger จำเป็น (ใช้เป็นปุ่มสั่งซื้อในหน้าเว็บลูกค้า) ลิงก์ Facebook ไม่บังคับ
    const messenger = normalizeUrl(form.messenger_url);
    if (!messenger) {
      setMsg({ ok: false, text: form.messenger_url.trim() ? "ลิงก์ Messenger ไม่ถูกต้อง" : "กรุณากรอกลิงก์ Messenger (ใช้เป็นปุ่มสั่งซื้อในหน้าเว็บ)" });
      return;
    }
    const facebook = form.facebook_url.trim() ? normalizeUrl(form.facebook_url) : "";
    if (facebook === null) {
      setMsg({ ok: false, text: "ลิงก์ Facebook ไม่ถูกต้อง" });
      return;
    }
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries({ ...form, messenger_url: messenger, facebook_url: facebook ?? "" }).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
    );
    const { error } = await sb().from("store_settings").update(payload).eq("id", 1);
    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" });
      return;
    }
    setForm((f) => ({ ...f, messenger_url: messenger, facebook_url: facebook ?? "" }));
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
      <LinkField
        id="facebook-url"
        label="ลิงก์ Facebook"
        value={form.facebook_url}
        onChange={(v) => set("facebook_url", v)}
        placeholder="https://www.facebook.com/..."
        hint="ไม่บังคับ จะแสดงปุ่ม Facebook ท้ายหน้าเว็บ"
      />
      <LinkField
        id="messenger-url"
        label="ลิงก์ Messenger"
        required
        value={form.messenger_url}
        onChange={(v) => set("messenger_url", v)}
        placeholder="https://m.me/ชื่อเพจ"
        hint="ลูกค้ากดสั่งซื้อในหน้าเว็บ จะเปิดแชทนี้พร้อมข้อความรายการสินค้า"
      />
      {needMigration && <p className="adm-msg err">ต้องรัน migration 0006_social_links.sql ใน Supabase SQL Editor ก่อน ช่อง Facebook/Messenger ถึงจะบันทึกได้</p>}
      {msg && <p className={`adm-msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</p>}
      <div className="adm-actions">
        <button className="btn btn-dark" type="submit" disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
