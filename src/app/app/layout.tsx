import Link from "next/link";
import { AppNavigation } from "@/components/AppNavigation";
import { Brand } from "@/components/Brand";
import { LogoutButton } from "@/components/LogoutButton";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <>
    <div className="direction-contract" aria-hidden="true" dangerouslySetInnerHTML={{ __html: "<!-- THESIS: Un mostrador digital conecta cada hallazgo con su proxima venta; la tarea precede al adorno. OWN-WORLD: Verde bosque, menta clara y blanco; tipografia humanista, fotografias completas, controles suaves y cifras tabulares. STORY: Revisar disponibilidad, registrar una pieza, vender o compartir el catalogo desde un mismo espacio. FIRST VIEWPORT: Encabezado compacto con alta, balance acumulado y lista de piezas reales junto al acceso al catalogo. FORM: Mostrador de tienda de barrio, candidato cuatro, lista operativa y escaparate lateral; seed 3dd0c398. -->" }} />
    <div className="app-shell">
      <aside className="app-rail">
        <Brand />
        <div className="business-stamp"><Link href="/app/negocios">Mis negocios</Link><strong title={user.business.name}>{user.business.name}</strong></div>
        <AppNavigation />
        <div className="rail-footer"><span className="rail-caption">Tu escaparate digital</span><Link href={`/catalogo/${user.business.slug}`} target="_blank">Ver catálogo público <span aria-hidden="true">↗</span></Link><LogoutButton /></div>
      </aside>
      <div className="app-stage">
        <header className="app-header"><Brand /><Link className="business-name" href="/app/negocios" title={user.business.name}>{user.business.name}</Link><div className="header-actions"><Link href={`/catalogo/${user.business.slug}`} target="_blank">Catálogo <span aria-hidden="true">↗</span></Link><LogoutButton /></div></header>
        {children}
      </div>
    </div>
    <AppNavigation mobile />
  </>;
}
