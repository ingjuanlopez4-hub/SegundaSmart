import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSalesMetrics } from "@/lib/sale-history";

export const metadata = { title: "Resumen" };
export default async function DashboardPage() {
  const user = await requireUser();
  const [available, sold, metrics] = await Promise.all([
    db.product.count({ where: { businessId: user.businessId, status: "AVAILABLE" } }),
    db.product.count({ where: { businessId: user.businessId, status: "SOLD" } }),
    getSalesMetrics(db, user.businessId),
  ]);
  return <main id="contenido" className="page dashboard-page">
    <section className="intake-hero">
      <div className="hero-copy"><p className="kicker">Mesa de registro · {user.business.name}</p><h1>¿Qué pieza entra hoy?</h1><p>Fotografía el hallazgo, fija su precio y déjalo listo para compartir. La ficha queda en tu inventario desde el primer guardado.</p></div>
      <Link className="intake-action" href="/app/productos/nuevo"><span aria-hidden="true">+</span><strong>Agregar pieza</strong><small>Nuevo ingreso</small></Link>
    </section>
    <section className="ledger" aria-label="Estado del negocio"><div><span>Disponibles</span><strong>{available}</strong></div><div><span>Vendidas</span><strong>{sold}</strong></div><div><span>Ingresos</span><strong>{formatMoney(metrics.revenue)}</strong></div><div><span>Ganancia</span><strong>{formatMoney(metrics.profit)}</strong></div></section>
    <section className="dashboard-note"><div><p className="kicker">Siguiente movimiento</p><h2>{available > 0 ? `${available} ${available === 1 ? "pieza está" : "piezas están"} a la vista` : "Tu mesa está lista"}</h2><p className="muted">{available > 0 ? "Abre el inventario para descargar códigos QR o registrar una venta." : "Registra la primera pieza con foto, costo y precio. Después aparecerá en tu catálogo público."}</p></div><div className="cluster">{available > 0 && <Link className="button secondary" href="/app/inventario">Revisar inventario</Link>}<Link className="text-link" href={`/catalogo/${user.business.slug}`} target="_blank">Ver catálogo público <span aria-hidden="true">↗</span></Link></div></section>
  </main>;
}
