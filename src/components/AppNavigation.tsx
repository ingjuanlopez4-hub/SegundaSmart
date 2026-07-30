"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/app", "Resumen", "Vista general"],
  ["/app/inventario", "Inventario", "Piezas registradas"],
  ["/app/productos/nuevo", "Agregar pieza", "Nuevo ingreso"],
  ["/app/ventas", "Ventas", "Caja e historial"],
] as const;

function isCurrent(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname.startsWith(href);
}

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return <nav className={mobile ? "bottom-nav" : "side-nav"} aria-label="Navegación principal">
    {links.map(([href, label, detail]) => {
      const current = isCurrent(pathname, href);
      return <Link key={href} href={href} aria-current={current ? "page" : undefined} className={href.includes("/nuevo") ? "nav-add" : undefined}>
        <span className="nav-marker" aria-hidden="true">{href.includes("/nuevo") ? "+" : label.slice(0, 2).toUpperCase()}</span>
        <span className="nav-copy"><strong>{mobile && href.includes("/nuevo") ? "Agregar" : label}</strong>{!mobile && <small>{detail}</small>}</span>
      </Link>;
    })}
  </nav>;
}
