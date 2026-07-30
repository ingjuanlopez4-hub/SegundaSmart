import Link from "next/link";
import { FlashNotice } from "@/components/FlashNotice";
import { ProductCard } from "@/components/ProductCard";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Inventario" };
export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const products = await db.product.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } });
  const available = products.filter((product) => product.status === "AVAILABLE");
  const sold = products.filter((product) => product.status === "SOLD");
  return <main id="contenido" className="page stack page-content"><header className="page-heading"><div><p className="kicker">Piezas únicas · {products.length} registradas</p><h1>Inventario</h1><p className="muted">Cada ficha reúne su fotografía, estado y acciones disponibles.</p></div><Link className="button" href="/app/productos/nuevo">Agregar pieza</Link></header>{params.creado === "1" && <FlashNotice param="creado"><strong>Pieza registrada.</strong> Ya está disponible en tu inventario y catálogo público.</FlashNotice>}{products.length === 0 ? <section className="empty-state"><span className="empty-mark" aria-hidden="true">+</span><div><h2>La primera ficha empieza aquí</h2><p className="muted">Agrega una pieza para comenzar tu inventario y catálogo.</p></div><Link className="button" href="/app/productos/nuevo">Registrar primera pieza</Link></section> : <><section className="inventory-section" aria-labelledby="disponibles"><div className="section-heading"><h2 id="disponibles">Disponibles</h2><span>{available.length}</span></div>{available.length === 0 ? <p className="muted">No hay piezas disponibles para vender.</p> : <div className="product-grid">{available.map((product) => <ProductCard key={product.id} product={product} privateView />)}</div>}</section>{sold.length > 0 && <section className="inventory-section sold-section" aria-labelledby="vendidas"><div className="section-heading"><h2 id="vendidas">Vendidas</h2><span>{sold.length}</span></div><div className="product-grid">{sold.map((product) => <ProductCard key={product.id} product={product} privateView />)}</div></section>}</>}</main>;
}
