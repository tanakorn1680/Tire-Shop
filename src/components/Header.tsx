import Link from "next/link";
import { getSite, hasContact, t } from "@/lib/supabase";
import CartButton from "./cart/CartButton";

export default async function Header() {
  const { settings: s, services } = await getSite();
  const name = t(s.store_name), tag = t(s.tagline), phone = t(s.phone), line = t(s.line_url);
  const nav = [
    { label: "หน้าแรก", href: "/" },
    { label: "สินค้า", href: "/products" },
    ...(services.length ? [{ label: "บริการ", href: "/#services" }] : []),
    ...(hasContact(s) ? [{ label: "ติดต่อ", href: "#contact" }] : []),
  ];
  const links = () => nav.map((n) => <Link key={n.label} href={n.href}>{n.label}</Link>);
  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        {name && <Link href="/" className="logo"><b>{name}</b>{tag && <small>{tag}</small>}</Link>}
        <nav className="nav-d">{links()}</nav>
        <div className="hdr-r">
          {phone && <a className="tel" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>}
          {line && <a className="btn btn-line" href={line}>LINE</a>}
          <CartButton />
        </div>
        <details className="nav-m">
          <summary aria-label="เมนู"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></summary>
          <div>{links()}</div>
        </details>
      </div>
    </header>
  );
}
