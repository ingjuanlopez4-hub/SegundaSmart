"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/app", "Resumen", "Vista general"],
  ["/app/inventario", "Inventario", "Piezas registradas"],
  ["/app/productos/nuevo", "Agregar pieza", "Nuevo ingreso"],
  ["/app/ventas", "Ventas", "Caja e historial"],
] as const;

const iconPaths = [
  "M3 11 12 3l9 8M5 10v11h5v-6h4v6h5V10",
  "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  "M12 5v14M5 12h14",
  "M5 3h14v18l-3-2-4 2-4-2-3 2V3ZM8 8h8M8 12h8",
];

function isCurrent(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname.startsWith(href);
}

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return <nav className={mobile ? "bottom-nav" : "side-nav"} aria-label="Navegación principal">
    {links.map(([href, label, detail], index) => {
      const current = isCurrent(pathname, href);
      return <Link key={href} href={href} prefetch={false} aria-current={current ? "page" : undefined} className={href.includes("/nuevo") ? "nav-add" : undefined}>
        <span className="nav-marker" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[index]} /></svg></span>
        <span className="nav-copy"><strong>{mobile && href.includes("/nuevo") ? "Agregar" : label}</strong>{!mobile && <small>{detail}</small>}</span>
      </Link>;
    })}
  </nav>;
}
