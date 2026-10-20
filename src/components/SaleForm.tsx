"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatMoney } from "@/lib/money";
import { saleSchema } from "@/lib/validation";

type SaleProduct = { id: string; reference: string; name: string; category: string; priceCents: number; costCents: number };
type SaleFormProps = { products: SaleProduct[]; initialId?: string };

export function SaleForm(props: SaleFormProps) {
  return <SaleEntry key={`${props.initialId ?? ""}:${props.products.map((product) => product.id).join(",")}`} {...props} />;
}

function SaleEntry({ products, initialId }: SaleFormProps) {
  const router = useRouter();
  const initial = initialId ? products.find((item) => item.id === initialId) : products[0];
  const [amount, setAmount] = useState(initial ? (initial.priceCents / 100).toFixed(2) : "");
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const availableProducts = products.filter((product) => !unavailableIds.includes(product.id));
  const saving = useRef(false);
  const selected = products.find((item) => item.id === selectedId);
  const amountCents = toCents(amount);
  const estimatedProfit = selected && amountCents !== null ? amountCents - selected.costCents : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const data = new FormData(event.currentTarget);
    const input = saleSchema.safeParse(Object.fromEntries(data));
    if (!input.success) {
      const issue = input.error.issues[0];
      setError(issue?.message ?? "Revisa los datos de la venta");
      const field = event.currentTarget.elements.namedItem(String(issue?.path[0]));
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    const selected = products.find((item) => item.id === selectedId);
    if (!selected || !window.confirm(`Registrar la venta de “${selected.name}” por $${amount} MXN? Ganancia estimada: ${estimatedProfit === null ? "por calcular" : formatMoney(estimatedProfit)}. Esta pieza dejará de aparecer en el catálogo.`)) return;
    saving.current = true;
    setPending(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/ventas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data.entries())) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status === 409) {
          setUnavailableIds((ids) => [...ids, selected.id]);
          setSelectedId("");
          setAmount("");
          setError("La pieza ya no está disponible. Actualizando las piezas disponibles…");
          // Una navegación completa descarta también el estado de otras pestañas
          // conservado en la caché del router. El enlace inválido exige elegir de nuevo.
          window.location.assign(`/app/ventas?producto=${encodeURIComponent(selected.id)}`);
          return;
        }
        throw new Error(result.error ?? "No se pudo registrar la venta");
      }
      setSuccess("Venta registrada. La pieza ya no aparece en el catálogo público.");
      router.push("/app/ventas?venta=1");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo registrar la venta"); saving.current = false; setPending(false); }
  }

  if (availableProducts.length === 0) return <section className="panel"><h2>No hay piezas disponibles</h2><p className="muted">Las piezas vendidas no pueden venderse de nuevo. Agrega inventario para registrar otra venta.</p></section>;
  return <form className="sale-form stack" onSubmit={submit}>
    {initialId && !initial && <div className="alert" role="status">La pieza del enlace ya no está disponible. Elige otra pieza para continuar.</div>}
    <div className="field"><label htmlFor="productId">Pieza disponible</label><select id="productId" name="productId" required disabled={pending} value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setError(""); const product = availableProducts.find((item) => item.id === event.target.value); if (product) setAmount((product.priceCents / 100).toFixed(2)); }}><option value="" disabled>Elige una pieza disponible</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.reference} · {product.name} · {product.category} · ${(product.priceCents / 100).toFixed(2)}</option>)}</select></div>
    <div className="field"><label htmlFor="amount">Importe final (MXN)</label><input id="amount" name="amount" type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" required disabled={pending} value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
    <div className="estimate-note" aria-live="polite"><span>Ganancia estimada</span><strong>{estimatedProfit === null ? "Completa el importe" : formatMoney(estimatedProfit)}</strong><small>Importe final menos costo; no incluye otros gastos.</small></div>
    {error && <div className="alert" role="alert">{error}</div>}{success && <div className="alert success" role="status">{success}</div>}
    <button className="button" disabled={pending}>{pending ? "Registrando venta…" : "Registrar venta"}</button>
  </form>;
}

function toCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  return Math.round(Number(value) * 100);
}
