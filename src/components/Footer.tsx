import { getSite, hasContact, imageUrl, t } from "@/lib/supabase";

export default async function Footer() {
  const { settings: s } = await getSite();
  const name = t(s.store_name), phone = t(s.phone);
  const hours = t(s.hours), address = t(s.address), line = t(s.line_url), fb = t(s.facebook_url);
  const shopImg = imageUrl(s.store_image_path);
  const map = t(s.map_url);
  if (!name && !hasContact(s) && !shopImg && !map) return null;
  const info = (
    <>
      {name && <div className="logo"><b>{name}</b></div>}
      {(phone || hours) && <div>{phone && <>โทร {phone}<br /></>}{hours}</div>}
      {address && <div>{address}</div>}
      {line && <a className="btn btn-brand" href={line}>ติดต่อทาง LINE</a>}
      {(fb || map) && (
        <div className="ftr-soc">
          {fb && (
            <a className="ftr-ic ftr-fb" href={fb} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
          )}
          {map && (
            <a className="ftr-ic ftr-map" href={map} target="_blank" rel="noopener noreferrer" aria-label="แผนที่ร้าน" title="แผนที่ร้าน">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </a>
          )}
        </div>
      )}
    </>
  );
  return (
    <footer className="ftr" id="contact">
      <div className="wrap">
        {shopImg ? (
          <div className="ftr-in ftr-photo">
            <img className="ftr-img" src={shopImg} alt={name || "หน้าร้าน"} loading="lazy" />
            <div className="ftr-info">{info}</div>
          </div>
        ) : (
          <div className="ftr-in">{info}</div>
        )}
        {name && <p className="cp">© {new Date().getFullYear()} {name}</p>}
      </div>
    </footer>
  );
}
