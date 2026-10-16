"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// หน้าต่างยืนยันในธีมเดียวกับเว็บ (ใช้แทน confirm() ของเบราว์เซอร์ทุกจุดในหน้าแอดมิน)
type Opts = { title?: string; message: string; confirmText?: string; danger?: boolean };

const Ctx = createContext<(o: Opts) => Promise<boolean>>(() => Promise.resolve(false));
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<Opts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);

  const ask = useCallback(
    (o: Opts) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );

  const close = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setOpts(null);
  }, []);

  useEffect(() => {
    if (!opts) return;
    cancelBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [opts, close]);

  return (
    <Ctx.Provider value={ask}>
      {children}
      {opts && (
        <div className="adm-dlg-back" onClick={() => close(false)}>
          <div className="adm-dlg" role="alertdialog" aria-modal="true" aria-labelledby="adm-dlg-t" onClick={(e) => e.stopPropagation()}>
            <h2 id="adm-dlg-t">{opts.title ?? (opts.danger ? "ยืนยันการลบ" : "ยืนยัน")}</h2>
            <p>{opts.message}</p>
            <div className="adm-dlg-acts">
              <button type="button" className="btn btn-ghost" ref={cancelBtn} onClick={() => close(false)}>ยกเลิก</button>
              <button type="button" className={`btn ${opts.danger ? "btn-danger-solid" : "btn-dark"}`} onClick={() => close(true)}>
                {opts.confirmText ?? (opts.danger ? "ลบ" : "ตกลง")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
