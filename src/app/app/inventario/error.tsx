"use client";

import { useState } from "react";
import { flushSync } from "react-dom";

export default function InventoryError() {
  const [pending, setPending] = useState(false);
  // A fresh document also discards a failed RSC response, preserving query and status.
  return <main id="contenido" className="page page-content stack inventory-page" aria-busy={pending}><header className="inventory-heading"><h1>Inventario</h1></header><section className="empty-state"><div role="alert"><h2>No pudimos cargar las piezas</h2><p>Tu inventario no se ha modificado. Intenta cargarlo de nuevo.</p></div><button className="button" type="button" disabled={pending} onClick={() => { flushSync(() => setPending(true)); window.location.reload(); }}>{pending ? "Cargando piezas…" : "Reintentar carga"}</button></section></main>;
}
