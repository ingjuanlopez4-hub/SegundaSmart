import { BusinessForm } from "@/components/BusinessForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Mis negocios" };

export default async function BusinessesPage() {
  const user = await requireUser();
  const owned = await db.businessOwnership.findMany({ where: { userId: user.id }, include: { business: true }, orderBy: { business: { createdAt: "asc" } } });
  return <main className="page page-content stack"><header><p className="kicker">Mi espacio de trabajo</p><h1>Mis negocios</h1><p className="muted">Crea un negocio o abre uno de los tuyos.</p></header><div className="auth-card stack"><BusinessForm businesses={owned.map(({ business }) => ({ id: business.id, name: business.name }))} activeId={user.businessId} /></div></main>;
}
