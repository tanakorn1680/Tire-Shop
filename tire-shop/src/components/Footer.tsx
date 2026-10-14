import { site } from "@/site.config";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="ftr" id="contact">
      <div className="wrap">
        <div className="ftr-in">
          <Logo />
          <div>📞 {site.phone}<br />{site.hours}</div>
          <div>📍 {site.address}</div>
          <a className="btn btn-brand" href={site.lineUrl}>ติดต่อเรา</a>
        </div>
        <p className="cp">© {new Date().getFullYear()} {site.name} สงวนลิขสิทธิ์</p>
      </div>
    </footer>
  );
}
