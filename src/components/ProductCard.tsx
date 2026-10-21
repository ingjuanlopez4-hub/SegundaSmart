import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { ProductPhoto } from "./ProductPhoto";

type ProductCardProps = { product: { id: string; reference: string; name: string; category: string; condition: string; defects: string | null; photoPath: string; priceCents: number; status: "AVAILABLE" | "SOLD" }; privateView?: boolean; publicHref?: string };

export function ProductCard({ product, privateView = false, publicHref }: ProductCardProps) {
  return <article className={`product-card${privateView ? " private-product-card" : ""}`} id={`producto-${product.id}`} aria-labelledby={`nombre-${product.id}`}>
    <ProductPhoto src={product.photoPath} name={product.name} />
    <div className="product-card-body">
      <div className="record-line"><span className={`badge ${product.status === "SOLD" ? "sold" : ""}`}>{product.status === "AVAILABLE" ? "Disponible" : "Vendida"}</span><span className="record-id">{product.reference}</span></div>
      <div><h3 id={`nombre-${product.id}`}>{product.name}</h3><span className="muted product-category">{product.category} · {product.condition}</span></div>
      {product.defects && <p className="product-defects"><strong>Detalles:</strong> {product.defects}</p>}
      <span className="price">{formatMoney(product.priceCents)} <small>MXN</small></span>
      {publicHref && !privateView && <Link className="text-link" href={publicHref}>Ver y compartir pieza</Link>}
    </div>
    {privateView && <div className="card-actions">
      {product.status === "AVAILABLE" && <Link className="button" href={`/app/ventas?producto=${product.id}`}>Registrar venta</Link>}
      {product.status === "AVAILABLE" && publicHref && <Link className="button secondary" href={publicHref} target="_blank">Ver y compartir <span className="sr-only">{product.name} (abre otra pestaña)</span></Link>}
      <a className="button secondary" href={`/api/productos/${product.id}/qr`} download={`qr-${product.name}.png`}>Descargar QR <span className="sr-only">de {product.name}</span></a>
    </div>}
  </article>;
}
