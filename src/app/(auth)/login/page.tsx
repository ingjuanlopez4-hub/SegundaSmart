import Link from "next/link";
import { Brand } from "@/components/Brand";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Entrar" };
export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/app");
  return <div className="auth-card stack"><Brand href="/login" /><div><p className="kicker">Tu mesa de registro</p><h1>Vuelve a tus piezas.</h1><p className="muted">Administra inventario, ventas y catálogo desde un solo lugar.</p></div><AuthForm mode="login" /><p className="muted">¿Aún no tienes cuenta? <Link href="/registro">Crea tu negocio</Link></p></div>;
}
