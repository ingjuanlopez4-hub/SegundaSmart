import Link from "next/link";
import { FlashNotice } from "@/components/FlashNotice";
import { ProductCard } from "@/components/ProductCard";
import { ProductSearch } from "@/components/ProductSearch";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publicProductPath } from "@/lib/product-reference";
import { normalizeProductQuery, productSearchWhere } from "@/lib/product-search";

export const metadata = { title: "Inventario" };
export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ creado?: string; q?: string | string[] }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = normalizeProductQuery(params.q);
  const [products, totalProducts] = await Promise.all([
    db.product.findMany({ where: productSearchWhere({ businessId: user.businessId, businessSlug: user.business.slug, query }), orderBy: { createdAt: "desc" } }),
    db.product.count({ where: { businessId: user.businessId } }),
  ]);
  const available = products.filter((product) => product.status === "AVAILABLE");
  const sold = products.filter((product) => product.status === "SOLD");
  return <main id="contenido" className="page stack page-content"><header className="page-heading"><div><p className="kicker">Piezas únicas · {totalProducts} registradas</p><h1>Inventario</h1><p className="muted">Cada ficha reúne su fotografía, estado y acciones disponibles.</p></div><Link className="button" href="/app/productos/nuevo">Agregar pieza</Link></header>{params.creado === "1" && <FlashNotice param="creado"><strong>Pieza registrada.</strong> Ya está disponible en tu inventario y catálogo público.</FlashNotice>}<ProductSearch initialQuery={query} />{products.length === 0 ? query ? <section className="empty-state"><div><h2>Sin coincidencias</h2><p className="muted">Prueba con otro nombre, la referencia completa o la URL del QR de este negocio.</p></div><Link className="button secondary" href="/app/inventario">Limpiar búsqueda</Link></section> : <section className="empty-state"><span className="empty-mark" aria-hidden="true">+</span><div><h2>La primera ficha empieza aquí</h2><p className="muted">Agrega una pieza para comenzar tu inventario y catálogo.</p></div><Link className="button" href="/app/productos/nuevo">Registrar primera pieza</Link></section> : <><section className="inventory-section" aria-labelledby="disponibles"><div className="section-heading"><h2 id="disponibles">Disponibles</h2><span>{available.length}</span></div>{available.length === 0 ? <p className="muted">No hay piezas disponibles en estos resultados.</p> : <div className="product-grid">{available.map((product) => <ProductCard key={product.id} product={product} privateView publicHref={publicProductPath(user.business.slug, product.id)} />)}</div>}</section>{sold.length > 0 && <section className="inventory-section sold-section" aria-labelledby="vendidas"><div className="section-heading"><h2 id="vendidas">Vendidas</h2><span>{sold.length}</span></div><div className="product-grid">{sold.map((product) => <ProductCard key={product.id} product={product} privateView />)}</div></section>}</>}</main>;
}
