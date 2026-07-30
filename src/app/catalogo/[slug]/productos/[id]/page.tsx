import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ProductCard } from "@/components/ProductCard";
import { ShareLinks } from "@/components/ShareLinks";
import { db } from "@/lib/db";
import { absoluteAppUrl, publicProductPath } from "@/lib/product-reference";
import { getPublicProduct } from "@/lib/public-products";

export const revalidate = 0;

type PageParams = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: PageParams) {
  const { slug, id } = await params;
  const product = await getPublicProduct(db, slug, id);
  return product
    ? { title: `${product.name} · ${product.reference}`, description: product.description }
    : { title: "Pieza no disponible", robots: { index: false, follow: false } };
}

export default async function PublicProductPage({ params }: PageParams) {
  const { slug, id } = await params;
  const business = await db.business.findUnique({ where: { slug }, select: { name: true, slug: true } });
  if (!business) return <UnavailableCatalog />;

  const product = await getPublicProduct(db, slug, id);
  const catalogPath = `/catalogo/${business.slug}`;
  if (!product) {
    return <><CatalogHeader href={catalogPath} /><main id="contenido" className="narrow page stack"><p className="eyebrow">Catálogo de {business.name}</p><h1>Esta pieza ya no está disponible</h1><p className="muted">Puede haberse vendido o el enlace puede no ser válido. No mostramos información de piezas que no están disponibles.</p><Link className="button" href={catalogPath}>Ver piezas disponibles</Link></main></>;
  }

  const path = publicProductPath(business.slug, product.id);
  const url = absoluteAppUrl(path);
  return <><CatalogHeader href={catalogPath} /><main id="contenido" className="container page public-product-page"><nav aria-label="Ruta de navegación"><Link className="text-link" href={catalogPath}>← Volver al catálogo</Link></nav><div className="public-product-layout"><ProductCard product={product} /><section className="stack" aria-labelledby="descripcion-pieza"><div><p className="eyebrow">{product.reference}</p><h1 id="descripcion-pieza">Detalles de la pieza</h1></div><p>{product.description}</p>{product.defects && <div className="alert detail-alert"><strong>Defectos o detalles visibles</strong><span>{product.defects}</span></div>}<ShareLinks url={url} label={`${product.name} disponible en ${business.name}`} /></section></div></main></>;
}

function CatalogHeader({ href }: { href: string }) {
  return <header className="catalog-header"><div className="container"><Brand href={href} /></div></header>;
}

function UnavailableCatalog() {
  return <main id="contenido" className="narrow page stack"><h1>Pieza no disponible</h1><p className="muted">El catálogo o la pieza no existen.</p><Link className="button" href="/">Volver al inicio</Link></main>;
}
