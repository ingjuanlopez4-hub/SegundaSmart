import Link from "next/link";
import { Brand } from "@/components/Brand";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Crear cuenta" };
export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/app");
  return <div className="auth-card stack"><Brand href="/registro" /><div><p className="kicker">Nuevo espacio de trabajo</p><h1>Registra lo que merece otra vida.</h1><p className="muted">Crea el espacio privado de tu negocio y publica tu catálogo.</p></div><AuthForm mode="register" /><p className="muted">¿Ya tienes cuenta? <Link href="/login">Entrar</Link></p></div>;
}
