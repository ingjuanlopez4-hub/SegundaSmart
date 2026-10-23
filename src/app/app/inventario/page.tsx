import Link from "next/link";
import { FlashNotice } from "@/components/FlashNotice";
import { ProductCard } from "@/components/ProductCard";
import { ProductSearch } from "@/components/ProductSearch";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryHref, normalizeInventoryStatus } from "@/lib/inventory-filters";
import { getInventoryPage, parseInventoryPage } from "@/lib/inventory-page";
import { publicProductPath } from "@/lib/product-reference";
import { normalizeProductQuery } from "@/lib/product-search";

export const metadata = { title: "Inventario" };

export default async function InventoryPage({ searchParams }: {
  searchParams: Promise<{ creado?: string; q?: string | string[]; estado?: string | string[]; pagina?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeProductQuery(params.q);
  const status = normalizeInventoryStatus(params.estado);
  const { products: visible, totalProducts, total, available, sold, matching, page, totalPages } = await getInventoryPage(db, {
    businessId: user.businessId, businessSlug: user.business.slug, query, status, page: parseInventoryPage(params.pagina),
  });
  const filters = [
    { value: "todas", label: "Todas", count: total },
    { value: "disponibles", label: "Disponibles", count: available },
    { value: "vendidas", label: "Vendidas", count: sold },
  ] as const;

  return <main id="contenido" className="page stack page-content inventory-page">
    <header className="page-heading inventory-heading">
      <div><p className="kicker">Piezas únicas · {totalProducts} registradas</p><h1>Inventario</h1><p className="muted">Encuentra una pieza para compartirla o registrar su venta.</p></div>
      <Link className="button intake-button" href="/app/productos/nuevo"><span aria-hidden="true">＋</span> Agregar pieza</Link>
    </header>
    {params.creado === "1" && <FlashNotice param="creado"><strong>Pieza registrada.</strong> Ya está disponible en tu inventario y catálogo público.</FlashNotice>}
    <ProductSearch initialQuery={query} inventoryStatus={status} />
    <section className="inventory-results" aria-labelledby="inventory-results-title">
      <h2 id="inventory-results-title" className="sr-only">Piezas del inventario</h2>
      <nav className="inventory-filters" aria-label="Filtrar inventario por estado">
        {filters.map((filter) => <a key={filter.value} href={inventoryHref(query, filter.value)} aria-current={status === filter.value ? "page" : undefined}>{filter.label} <span>{filter.count}</span></a>)}
      </nav>
      <p className="inventory-result-count" role="status">{matching} {matching === 1 ? "pieza" : "piezas"}{query && <> para «{query}»</>}{status !== "todas" && ` · ${status}`}. Más recientes primero.{totalPages > 1 && ` Mostrando ${visible.length} · página ${page} de ${totalPages}.`}</p>
      {visible.length === 0 ? <section className="empty-state">
        <div><h2>{totalProducts === 0 ? "La primera ficha empieza aquí" : query ? "Sin coincidencias" : status === "vendidas" ? "Aún no hay piezas vendidas" : "No hay piezas disponibles"}</h2>
          <p className="muted">{totalProducts === 0 ? "Agrega una pieza con fotografía y precio para iniciar tu inventario y catálogo." : query ? "Prueba otro nombre, la referencia completa o la URL del QR de este negocio." : status === "vendidas" ? "Cuando registres una venta, la pieza aparecerá aquí y saldrá del catálogo público." : "Agrega una nueva pieza para publicarla en tu catálogo."}</p></div>
        {totalProducts === 0 || (!query && status === "disponibles") ? <Link className="button intake-button" href="/app/productos/nuevo">Agregar pieza</Link> : <a className="button secondary" href={inventoryHref("", query ? status : "todas")}>{query ? "Limpiar búsqueda" : "Ver todas las piezas"}</a>}
      </section> : <div className="product-grid inventory-grid">{visible.map((product) => <ProductCard key={product.id} product={product} privateView publicHref={product.status === "AVAILABLE" ? publicProductPath(user.business.slug, product.id) : undefined} />)}</div>}
      {totalPages > 1 && <nav className="pagination" aria-label="Páginas del inventario">
        {page > 1 ? <a className="button secondary" href={inventoryHref(query, status, page - 1)}>Anterior</a> : <span />}
        <span className="muted">Página {page} de {totalPages}</span>
        {page < totalPages ? <a className="button secondary" href={inventoryHref(query, status, page + 1)}>Siguiente</a> : <span />}
      </nav>}
    </section>
  </main>;
}
