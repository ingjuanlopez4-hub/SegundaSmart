import { notFound } from "next/navigation";
import { Brand } from "@/components/Brand";
import { ProductCard } from "@/components/ProductCard";
import { ShareLinks } from "@/components/ShareLinks";
import { db } from "@/lib/db";
import { absoluteAppUrl, publicProductPath } from "@/lib/product-reference";

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
  const url = absoluteAppUrl(`/catalogo/${business.slug}`);
  return <><header className="catalog-header"><div className="container"><Brand href={`/catalogo/${business.slug}`} /></div></header><main id="contenido"><section className="catalog-intro"><div className="container"><p className="eyebrow">Catálogo de segunda mano</p><h1>{business.name}</h1><p className="muted">Piezas únicas disponibles ahora. Cuando una pieza se vende, desaparece de este catálogo.</p><ShareLinks url={url} label={`Mira las piezas disponibles en ${business.name}`} /></div></section><section className="container page" aria-labelledby="disponibles"><h2 id="disponibles">Piezas disponibles</h2>{business.products.length === 0 ? <div className="panel"><p className="muted">No hay piezas disponibles por el momento. Vuelve pronto.</p></div> : <div className="product-grid">{business.products.map((product) => <div className="stack" key={product.id}><ProductCard product={product} publicHref={publicProductPath(business.slug, product.id)} /><p className="muted">{product.description}</p></div>)}</div>}</section></main></>;
}
