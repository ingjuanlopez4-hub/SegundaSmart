import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Nuevo producto" };
export default function NewProductPage() {
  return <main id="contenido" className="page page-content intake-page"><header className="page-heading"><div><p className="kicker">Nuevo ingreso</p><h1>Registra una pieza</h1><p className="muted">Empieza por la foto. La sugerencia automática es opcional y todo el contenido seguirá siendo editable.</p></div></header><ProductForm /></main>;
}
