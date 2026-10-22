import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSalesMetrics } from "@/lib/sale-history";
import { ProductPhoto } from "@/components/ProductPhoto";
import { ShareLinks } from "@/components/ShareLinks";
import { absoluteAppUrl, publicProductPath } from "@/lib/product-reference";

export const metadata = { title: "Resumen" };
export default async function DashboardPage() {
  const user = await requireUser();
  const [available, sold, metrics, recent] = await Promise.all([
    db.product.count({ where: { businessId: user.businessId, status: "AVAILABLE" } }),
    db.product.count({ where: { businessId: user.businessId, status: "SOLD" } }),
    getSalesMetrics(db, user.businessId),
    db.product.findMany({ where: { businessId: user.businessId, status: "AVAILABLE" }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);
  return <main id="contenido" className="page dashboard-page">
    <header className="page-heading dashboard-heading">
      <div><p className="kicker">Tu negocio, en un vistazo</p><h1>Cada pieza, una nueva oportunidad.</h1><p className="muted">Un lugar para tus hallazgos, tus ventas y lo que viene.</p></div>
      <Link className="button intake-button" href="/app/productos/nuevo"><span aria-hidden="true">＋</span> Agregar pieza</Link>
    </header>
    <section className="ledger" aria-label="Estado del negocio · totales acumulados">
      <div><span>Piezas disponibles</span><strong>{available}</strong><Link href="/app/inventario?estado=disponibles">Ver inventario <span aria-hidden="true">↗</span></Link></div>
      <div><span>Piezas vendidas</span><strong>{sold}</strong><Link href="/app/inventario?estado=vendidas">Ver piezas vendidas <span aria-hidden="true">↗</span></Link></div>
      <div><span>Ingresos acumulados</span><strong>{formatMoney(metrics.revenue)}</strong><small>MXN · ventas registradas</small></div>
      <div><span>Ganancia acumulada</span><strong>{formatMoney(metrics.profit)}</strong><small>MXN · ingresos menos costo</small></div>
    </section>
    <div className="dashboard-workspace">
      <section className="recent-pieces" aria-labelledby="recientes">
        <div className="section-heading"><div><h2 id="recientes">Listas para su próxima historia</h2><p className="muted">Tus piezas disponibles más recientes.</p></div><Link className="text-link" href="/app/inventario">Ver todas <span aria-hidden="true">→</span></Link></div>
        {recent.length ? <div className="recent-list">{recent.map((product) => <article className="recent-piece" key={product.id}>
          <ProductPhoto src={product.photoPath} name={product.name} />
          <div className="recent-piece-info"><span className="badge">Disponible</span><h3><Link href={publicProductPath(user.business.slug, product.id)} target="_blank">{product.name}<span className="sr-only"> (abre el catálogo en otra pestaña)</span></Link></h3><span className="muted">{product.category} · {product.condition}</span></div>
          <div className="recent-piece-action"><strong className="price">{formatMoney(product.priceCents)} <small>MXN</small></strong><Link className="button secondary" href={`/app/ventas?producto=${product.id}`}>Registrar venta</Link></div>
        </article>)}</div> : <div className="dashboard-empty"><span className="empty-symbol" aria-hidden="true">＋</span><h3>Tu próximo hallazgo empieza aquí</h3><p className="muted">Agrega una foto, el costo y el precio. Tu primera pieza aparecerá aquí y en tu catálogo.</p><Link className="button" href="/app/productos/nuevo">Registrar mi primera pieza</Link></div>}
      </section>
      <aside className="catalog-invitation" aria-labelledby="tu-catalogo"><div className="catalog-sign" aria-hidden="true"><span>Segunda</span><span>oportunidad.</span><span className="catalog-sign-arrow">↗</span></div><div className="catalog-invitation-copy"><h2 id="tu-catalogo">Tus hallazgos merecen verse.</h2><p>Comparte tu catálogo. Las piezas vendidas se retiran automáticamente.</p><Link className="text-link" href={`/catalogo/${user.business.slug}`} target="_blank">Abrir mi catálogo <span aria-hidden="true">↗</span></Link><ShareLinks url={absoluteAppUrl(`/catalogo/${user.business.slug}`)} label={`Mira las piezas disponibles en ${user.business.name}`} /></div></aside>
    </div>
    <footer className="dashboard-footer"><span>Solo piezas únicas. Siempre al día.</span><Link href="/app/ventas">Ir a ventas e historial <span aria-hidden="true">→</span></Link></footer>
  </main>;
}
