import Link from "next/link";
import { FlashNotice } from "@/components/FlashNotice";
import { SaleForm } from "@/components/SaleForm";
import { ProductSearch } from "@/components/ProductSearch";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSalesMetrics, getSalesPage, parseSalesPage } from "@/lib/sale-history";
import { normalizeProductQuery, productSearchWhere } from "@/lib/product-search";

export const metadata = { title: "Ventas" };
export default async function SalesPage({ searchParams }: { searchParams: Promise<{ producto?: string; pagina?: string | string[]; q?: string | string[]; venta?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeProductQuery(params.q);
  const [products, metrics] = await Promise.all([
    db.product.findMany({ where: productSearchWhere({ businessId: user.businessId, businessSlug: user.business.slug, query, status: "AVAILABLE" }), select: { id: true, reference: true, name: true, category: true, priceCents: true, costCents: true }, orderBy: { createdAt: "desc" } }),
    getSalesMetrics(db, user.businessId),
  ]);
  const { sales, page, totalPages } = await getSalesPage(db, user.businessId, parseSalesPage(params.pagina), metrics.count);

  return <main id="contenido" className="page stack page-content sales-page"><header className="page-heading"><div><p className="kicker">Caja</p><h1>Ventas y ganancias</h1><p className="muted">Cierra una pieza disponible y conserva su resultado en el historial.</p></div></header>{params.venta === "1" && <FlashNotice param="venta"><strong>Venta registrada.</strong> La pieza ya no aparece en el catálogo público.</FlashNotice>}<section className="ledger" aria-label="Resultados acumulados"><div><span>Ventas</span><strong>{metrics.count}</strong></div><div><span>Ingresos</span><strong>{formatMoney(metrics.revenue)}</strong></div><div><span>Ganancia</span><strong>{formatMoney(metrics.profit)}</strong></div></section><ProductSearch initialQuery={query} /><div className="sales-layout"><section aria-labelledby="registrar"><div className="section-heading"><h2 id="registrar">Registrar venta</h2><span>{products.length} disponibles</span></div>{query && products.length === 0 ? <div className="panel"><h3>Sin piezas disponibles</h3><p className="muted">No encontramos una pieza disponible con ese nombre, referencia o QR.</p><Link className="button secondary" href="/app/ventas">Limpiar búsqueda</Link></div> : <SaleForm key={products.map((product) => product.id).join(",")} products={products} initialId={params.producto} />}</section><section aria-labelledby="historial"><div className="section-heading"><h2 id="historial">Historial</h2><span>{metrics.count} ventas</span></div>{sales.length === 0 ? <div className="empty-inline"><p>Aún no hay ventas.</p><span className="muted">Las ventas confirmadas aparecerán aquí.</span></div> : <div className="sale-list">{sales.map((sale) => <article className="sale-row" key={sale.id}><div><strong>{sale.product.name}</strong><div className="muted"><time dateTime={sale.soldAt.toISOString()}>{sale.soldAt.toLocaleDateString("es-MX")}</time><span>Ganancia {formatMoney(sale.amountCents - sale.product.costCents)}</span></div></div><span className="price">{formatMoney(sale.amountCents)}</span></article>)}{totalPages > 1 && <nav className="pagination" aria-label="Páginas del historial de ventas">{page > 1 && <Link className="button secondary" href={`/app/ventas?pagina=${page - 1}`}>Más recientes</Link>}<span className="muted" aria-current="page">{page} de {totalPages}</span>{page < totalPages && <Link className="button secondary" href={`/app/ventas?pagina=${page + 1}`}>Anteriores</Link>}</nav>}</div>}</section></div></main>;
}
