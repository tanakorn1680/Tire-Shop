import { site } from "@/site.config";

export default function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--brand)" strokeWidth="7" />
        <circle cx="20" cy="20" r="5" fill="var(--brand)" />
      </svg>
      <span><b>{site.name}</b><small>{site.tagline}</small></span>
    </span>
  );
}
