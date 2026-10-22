import { ProductForm } from "@/components/ProductForm";

export const metadata = { title: "Nuevo producto" };
export default function NewProductPage() {
   return <main id="contenido" className="page page-content intake-page"><header className="page-heading"><div><p className="kicker">Un nuevo hallazgo</p><h1>Agrega tu próxima pieza</h1><p className="muted">Una foto, sus detalles y un precio. Al guardar, estará en tu inventario y catálogo.</p></div></header><ProductForm /></main>;
}
