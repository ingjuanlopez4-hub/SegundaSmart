import Link from "next/link";
import { FlashNotice } from "@/components/FlashNotice";
import { ProductCard } from "@/components/ProductCard";
import { ProductSearch } from "@/components/ProductSearch";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryHref, normalizeInventoryStatus } from "@/lib/inventory-filters";
import { publicProductPath } from "@/lib/product-reference";
import { normalizeProductQuery, productSearchWhere } from "@/lib/product-search";

export const metadata = { title: "Inventario" };

export default async function InventoryPage({ searchParams }: {
  searchParams: Promise<{ creado?: string; q?: string | string[]; estado?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeProductQuery(params.q);
  const status = normalizeInventoryStatus(params.estado);
  const [products, totalProducts] = await Promise.all([
    db.product.findMany({ where: productSearchWhere({ businessId: user.businessId, businessSlug: user.business.slug, query }), orderBy: { createdAt: "desc" } }),
    db.product.count({ where: { businessId: user.businessId } }),
  ]);
  const available = products.filter((product) => product.status === "AVAILABLE");
  const sold = products.filter((product) => product.status === "SOLD");
  const visible = status === "disponibles" ? available : status === "vendidas" ? sold : products;
  const filters = [
    { value: "todas", label: "Todas", count: products.length },
    { value: "disponibles", label: "Disponibles", count: available.length },
    { value: "vendidas", label: "Vendidas", count: sold.length },
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
        {filters.map((filter) => <Link key={filter.value} href={inventoryHref(query, filter.value)} prefetch={false} aria-current={status === filter.value ? "page" : undefined} scroll={false}>{filter.label} <span>{filter.count}</span></Link>)}
      </nav>
      <p className="inventory-result-count" role="status">{visible.length} {visible.length === 1 ? "pieza" : "piezas"}{query && <> para «{query}»</>}{status !== "todas" && ` · ${status}`}. Más recientes primero.</p>
      {visible.length === 0 ? <section className="empty-state">
        <div><h2>{totalProducts === 0 ? "La primera ficha empieza aquí" : query ? "Sin coincidencias" : status === "vendidas" ? "Aún no hay piezas vendidas" : "No hay piezas disponibles"}</h2>
          <p className="muted">{totalProducts === 0 ? "Agrega una pieza con fotografía y precio para iniciar tu inventario y catálogo." : query ? "Prueba otro nombre, la referencia completa o la URL del QR de este negocio." : status === "vendidas" ? "Cuando registres una venta, la pieza aparecerá aquí y saldrá del catálogo público." : "Agrega una nueva pieza para publicarla en tu catálogo."}</p></div>
        {totalProducts === 0 || (!query && status === "disponibles") ? <Link className="button intake-button" href="/app/productos/nuevo">Agregar pieza</Link> : <a className="button secondary" href={inventoryHref("", query ? status : "todas")}>{query ? "Limpiar búsqueda" : "Ver todas las piezas"}</a>}
      </section> : <div className="product-grid inventory-grid">{visible.map((product) => <ProductCard key={product.id} product={product} privateView publicHref={product.status === "AVAILABLE" ? publicProductPath(user.business.slug, product.id) : undefined} />)}</div>}
    </section>
  </main>;
}
