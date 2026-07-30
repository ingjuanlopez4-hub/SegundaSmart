import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

type ProductCardProps = { product: { id: string; name: string; category: string; photoPath: string; priceCents: number; status: "AVAILABLE" | "SOLD" }; privateView?: boolean };
export function ProductCard({ product, privateView = false }: ProductCardProps) {
  return <article className="product-card" id={`producto-${product.id}`}><div className="product-image"><Image src={product.photoPath} alt={`Fotografía de ${product.name}`} fill sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div><div className="product-card-body"><div className="record-line"><span className={`badge ${product.status === "SOLD" ? "sold" : ""}`}>{product.status === "AVAILABLE" ? "Disponible" : "Vendida"}</span><span className="record-id">PZ-{product.id.slice(-6).toUpperCase()}</span></div><div><h3>{product.name}</h3><span className="muted">{product.category}</span></div><span className="price">{formatMoney(product.priceCents)}</span>{privateView && <div className="card-actions"><a className="button secondary" href={`/api/productos/${product.id}/qr`} download={`qr-${product.name}.png`}>Descargar QR</a>{product.status === "AVAILABLE" && <Link className="button" href={`/app/ventas?producto=${product.id}`}>Registrar venta</Link>}</div>}</div></article>;
}
