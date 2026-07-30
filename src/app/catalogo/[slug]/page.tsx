import { notFound } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/lib/db";

export const revalidate = 0;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug }, select: { name: true } });
  return { title: business ? `Catálogo de ${business.name}` : "Catálogo", description: business ? `Piezas disponibles en ${business.name}` : "Catálogo de segunda mano" };
}

export default async function CatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug }, select: { name: true, slug: true, products: { where: { status: "AVAILABLE" }, orderBy: { createdAt: "desc" } } } });
  if (!business) notFound();
  const url = `${process.env.APP_URL || "http://localhost:3000"}/catalogo/${business.slug}`;
  const message = encodeURIComponent(`Mira las piezas disponibles en ${business.name}: ${url}`);
  return <><header className="catalog-header"><div className="container"><Brand href={`/catalogo/${business.slug}`} /></div></header><main id="contenido"><section className="catalog-intro"><div className="container"><p className="eyebrow">Catálogo de segunda mano</p><h1>{business.name}</h1><p className="muted">Piezas únicas disponibles ahora. Cuando una pieza se vende, desaparece de este catálogo.</p><div className="cluster"><a className="button" href={`https://wa.me/?text=${message}`} target="_blank" rel="noreferrer">Compartir por WhatsApp</a><a className="button secondary" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Compartir en Facebook</a></div></div></section><section className="container page" aria-labelledby="disponibles"><h2 id="disponibles">Piezas disponibles</h2>{business.products.length === 0 ? <div className="panel"><p className="muted">No hay piezas disponibles por el momento. Vuelve pronto.</p></div> : <div className="product-grid">{business.products.map((product) => <div className="stack" key={product.id}><ProductCard product={product} /><p className="muted">{product.description}</p></div>)}</div>}</section></main></>;
}
