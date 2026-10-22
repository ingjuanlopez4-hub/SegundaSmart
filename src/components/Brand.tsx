import Link from "next/link";

export function Brand({ href = "/app" }: { href?: string }) {
  return <Link className="brand" href={href}><span className="brand-index" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 8a8 8 0 0 0-14-1L3 10m0-6v6h6M5 16a8 8 0 0 0 14 1l2-3m0 6v-6h-6" /></svg></span><span>Segunda<span className="brand-smart">Smart</span></span></Link>;
}
