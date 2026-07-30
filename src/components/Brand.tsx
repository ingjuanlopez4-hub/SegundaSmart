import Link from "next/link";

export function Brand({ href = "/app" }: { href?: string }) {
  return <Link className="brand" href={href}><span className="brand-index" aria-hidden="true">SS</span><span>Segunda<wbr />Smart</span></Link>;
}
