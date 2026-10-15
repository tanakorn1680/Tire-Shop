"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

export default function AdminLogin() {
  const router = useRouter();
  const [id, setId] = useState(""); // อีเมลหรือ username
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input = id.trim();
    let email = input;

    // ไม่มี "@" ถือว่าเป็น username → หาอีเมลที่ผูกไว้ก่อน
    if (input && !input.includes("@")) {
      const { data, error: lookupError } = await sb().rpc("email_for_username", { lookup_username: input });
      if (lookupError || !data) {
        setLoading(false);
        setError("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      email = data as string;
    }

    const { error: signInError } = await sb().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="adm-auth">
      <form className="adm-card adm-auth-card" onSubmit={onSubmit}>
        <h1>เข้าสู่ระบบจัดการร้าน</h1>
        <label className="adm-f">
          อีเมลหรือชื่อผู้ใช้
          <input type="text" required value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
        </label>
        <label className="adm-f">
          รหัสผ่าน
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="adm-err">{error}</p>}
        <button className="btn btn-dark" type="submit" disabled={loading}>
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}
