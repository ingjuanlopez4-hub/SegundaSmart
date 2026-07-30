"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SaleProduct = { id: string; name: string; category: string; priceCents: number };
export function SaleForm({ products, initialId }: { products: SaleProduct[]; initialId?: string }) {
  const router = useRouter();
  const initial = products.find((item) => item.id === initialId) ?? products[0];
  const [amount, setAmount] = useState(initial ? (initial.priceCents / 100).toFixed(2) : "");
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = products.find((item) => item.id === selectedId);
    if (!selected || !window.confirm(`Registrar la venta de “${selected.name}” por $${amount} MXN? Esta pieza dejará de aparecer en el catálogo.`)) return;
    setPending(true); setError(""); setSuccess("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/ventas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data.entries())) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudo registrar la venta");
      setSuccess("Venta registrada. La pieza ya no aparece en el catálogo público.");
      router.push("/app/ventas?venta=1");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar la venta"); }
    finally { setPending(false); }
  }

  if (products.length === 0) return <section className="panel"><h2>No hay piezas disponibles</h2><p className="muted">Las piezas vendidas no pueden venderse de nuevo. Agrega inventario para registrar otra venta.</p></section>;
  return <form className="sale-form stack" onSubmit={submit}>
    <div className="field"><label htmlFor="productId">Pieza disponible</label><select id="productId" name="productId" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); const product = products.find((item) => item.id === event.target.value); if (product) setAmount((product.priceCents / 100).toFixed(2)); }}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.category} · ${(product.priceCents / 100).toFixed(2)}</option>)}</select></div>
    <div className="field"><label htmlFor="amount">Importe final (MXN)</label><input id="amount" name="amount" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
    {error && <div className="alert" role="alert">{error}</div>}{success && <div className="alert success" role="status">{success}</div>}
    <button className="button" disabled={pending}>{pending ? "Registrando venta…" : "Registrar venta"}</button>
  </form>;
}
