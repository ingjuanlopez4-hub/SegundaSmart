export default function LoadingInventory() {
  return <main id="contenido" className="page page-content stack inventory-page" aria-busy="true"><header className="inventory-heading"><h1>Inventario</h1></header><p role="status">Cargando tus piezas…</p><div className="inventory-loading" aria-hidden="true">{[0, 1, 2].map((key) => <div key={key} />)}</div></main>;
}
