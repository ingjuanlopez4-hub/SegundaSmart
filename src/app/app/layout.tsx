import Link from "next/link";
import { AppNavigation } from "@/components/AppNavigation";
import { Brand } from "@/components/Brand";
import { LogoutButton } from "@/components/LogoutButton";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <>
    <div className="direction-contract" aria-hidden="true" dangerouslySetInnerHTML={{ __html: "<!-- THESIS: Cada producto entra como una pieza irrepetible; rechaza el dashboard SaaS de tarjetas. OWN-WORLD: Azul archivo, blanco frio, grafito y coral; fichas, bandas de ingreso y sellos de estado. STORY: La persona identifica el estado del negocio y registra una pieza sin perder contexto. FIRST VIEWPORT: Mesa de trabajo con pregunta operativa, accion de alta dominante y tira contable. FORM: Registro de procedencia, candidato seis, mesa de catalogacion, seed 17e9fa05. -->" }} />
    <div className="app-shell">
      <aside className="app-rail">
        <Brand />
        <div className="business-stamp"><span>Espacio de trabajo</span><strong>{user.business.name}</strong></div>
        <AppNavigation />
        <div className="rail-footer"><Link href={`/catalogo/${user.business.slug}`} target="_blank">Abrir catálogo <span aria-hidden="true">↗</span></Link><LogoutButton /></div>
      </aside>
      <div className="app-stage">
        <header className="app-header"><Brand /><span className="business-name" title={user.business.name}>{user.business.name}</span><div className="header-actions"><Link href={`/catalogo/${user.business.slug}`} target="_blank">Catálogo <span aria-hidden="true">↗</span></Link><LogoutButton /></div></header>
        {children}
      </div>
    </div>
    <AppNavigation mobile />
  </>;
}
