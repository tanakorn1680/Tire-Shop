import Link from "next/link";
import { site } from "@/site.config";
import Logo from "./Logo";

const links = () => site.nav.map((n) => <Link key={n.label} href={n.href}>{n.label}</Link>);

export default function Header() {
  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Link href="/"><Logo /></Link>
        <nav className="nav-d">{links()}</nav>
        <div className="hdr-r">
          <a className="tel" href={`tel:${site.phone.replace(/-/g, "")}`}>📞 {site.phone}</a>
          <a className="btn btn-line" href={site.lineUrl}>LINE สอบถาม</a>
        </div>
        <details className="nav-m">
          <summary aria-label="เมนู">☰</summary>
          <div>{links()}</div>
        </details>
      </div>
    </header>
  );
}
