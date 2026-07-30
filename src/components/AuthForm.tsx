"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No pudimos continuar");
      router.push("/app");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos continuar");
      setPending(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit} aria-describedby={error ? "form-error" : undefined}>
      {mode === "register" && <>
        <div className="field"><label htmlFor="name">Tu nombre</label><input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" /></div>
        <div className="field"><label htmlFor="businessName">Nombre del negocio</label><input id="businessName" name="businessName" required minLength={2} maxLength={100} autoComplete="organization" /></div>
      </>}
      <div className="field"><label htmlFor="email">Correo</label><input id="email" name="email" type="email" required maxLength={254} autoComplete="email" /></div>
      <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required minLength={mode === "register" ? 8 : 1} maxLength={128} autoComplete={mode === "register" ? "new-password" : "current-password"} /><span className="hint">{mode === "register" ? "Mínimo 8 caracteres." : ""}</span></div>
      {error && <div id="form-error" role="alert" className="alert">{error}</div>}
      <button className="button" disabled={pending}>{pending ? "Guardando…" : mode === "login" ? "Entrar" : "Crear mi negocio"}</button>
    </form>
  );
}
