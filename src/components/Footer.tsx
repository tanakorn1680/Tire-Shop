import { getSite, hasContact, t } from "@/lib/supabase";

export default async function Footer() {
  const { settings: s } = await getSite();
  const name = t(s.store_name), tag = t(s.tagline), phone = t(s.phone);
  const hours = t(s.hours), address = t(s.address), line = t(s.line_url), fb = t(s.facebook_url);
  if (!name && !hasContact(s)) return null;
  return (
    <footer className="ftr" id="contact">
      <div className="wrap">
        <div className="ftr-in">
          {name && <div className="logo"><b>{name}</b>{tag && <small>{tag}</small>}</div>}
          {(phone || hours) && <div>{phone && <>โทร {phone}<br /></>}{hours}</div>}
          {address && <div>{address}</div>}
          {line && <a className="btn btn-brand" href={line}>ติดต่อทาง LINE</a>}
          {fb && <a className="btn btn-brand" href={fb} target="_blank" rel="noopener noreferrer">Facebook</a>}
        </div>
        {name && <p className="cp">© {new Date().getFullYear()} {name}</p>}
      </div>
    </footer>
  );
}
